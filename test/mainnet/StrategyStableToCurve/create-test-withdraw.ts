import BN from "bn.js"
import {Ierc20Instance} from "../../../types/Ierc20"
import {ControllerInstance} from "../../../types/Controller"
import {GaugeInstance} from "../../../types/Gauge"
import {StrategyInstance} from "./lib"
import {eq, sub, frac, pow} from "../../util"
import {Setup, getSnapshot} from "./lib"

export default (name: string, _setup: Setup, params: {DECIMALS: BN}) => {
  contract(name, (accounts) => {
    const {DECIMALS} = params
    const depositAmount = pow(10, DECIMALS).mul(new BN(100))

    const refs = _setup(accounts)
    const {vault, treasury, whale} = refs

    let underlying: Ierc20Instance
    let cUnderlying: Ierc20Instance
    let gauge: GaugeInstance
    let crv: Ierc20Instance
    let controller: ControllerInstance
    let strategy: StrategyInstance
    beforeEach(async () => {
      underlying = refs.underlying
      cUnderlying = refs.cUnderlying
      gauge = refs.gauge
      crv = refs.crv
      controller = refs.controller
      strategy = refs.strategy

      // deposit underlying into vault
      await underlying.transfer(vault, depositAmount, {from: whale})

      // deposit underlying into strategy
      await underlying.approve(strategy.address, depositAmount, {from: vault})
      await strategy.deposit(depositAmount, {from: vault})
    })

    it("should withdraw", async () => {
      const snapshot = getSnapshot({
        underlying,
        cUnderlying,
        crv,
        gauge,
        strategy,
        treasury,
        vault,
      })

      // withdraw amount may be < deposit amount
      // so here we get the maximum redeemable amount
      const withdrawAmount = await strategy.totalAssets()

      const before = await snapshot()
      await strategy.withdraw(withdrawAmount, {from: vault})
      const after = await snapshot()

      // minimum amount of underlying that can be withdrawn
      const minUnderlying = frac(depositAmount, 99, 100)

      // check balance of underlying transferred to vault
      const underlyingDiff = sub(after.underlying.vault, before.underlying.vault)

      assert(underlyingDiff.gte(minUnderlying), "underlying diff")

      // check strategy does not have any underlying
      assert(eq(after.underlying.strategy, new BN(0)), "underlying strategy")
      // check strategy dust is small
      assert(after.cUnderlying.strategy.lte(new BN(100)), "cUnderlying strategy")
    })
  })
}
