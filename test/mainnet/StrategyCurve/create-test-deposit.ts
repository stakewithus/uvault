import BN from "bn.js"
import {Ierc20Instance} from "../../../types/Ierc20"
import {ControllerInstance} from "../../../types/Controller"
import {GaugeInstance} from "../../../types/Gauge"
import {StrategyInstance} from "./lib"
import {frac, pow} from "../../util"
import {Setup, getSnapshot} from "./lib"

export default (
  name: string,
  _setup: Setup,
  params: {DECIMALS: BN; UNDERLYING_TO_CURVE_DECIMALS: BN}
) => {
  contract(name, (accounts) => {
    const refs = _setup(accounts)
    const {vault, treasury, whale} = refs

    const {DECIMALS, UNDERLYING_TO_CURVE_DECIMALS} = params

    let underlying: Ierc20Instance
    let lp: Ierc20Instance
    let gauge: GaugeInstance
    let crv: Ierc20Instance
    let controller: ControllerInstance
    let strategy: StrategyInstance
    beforeEach(() => {
      underlying = refs.underlying
      lp = refs.lp
      gauge = refs.gauge
      crv = refs.crv
      controller = refs.controller
      strategy = refs.strategy
    })

    it("should deposit", async () => {
      const depositAmount = pow(10, DECIMALS)

      // transfer underlying to vault
      await underlying.transfer(vault, depositAmount, {from: whale})

      // approve strategy to spend underlying from vault
      await underlying.approve(strategy.address, depositAmount, {from: vault})

      const snapshot = getSnapshot({
        underlying,
        lp,
        gauge,
        crv,
        strategy,
        vault,
        treasury,
      })

      const before = await snapshot()
      await strategy.deposit(depositAmount, {from: vault})
      const after = await snapshot()

      // minimum amount of underlying that can be withdrawn
      const minUnderlying = frac(depositAmount, 99, 100)
      // minimum amount of lp minted
      const minLp = frac(depositAmount.mul(UNDERLYING_TO_CURVE_DECIMALS), 95, 100)

      // underlying transferred from vault to strategy
      assert(
        after.underlying.vault.eq(before.underlying.vault.sub(depositAmount)),
        "underlying vault"
      )
      assert(
        after.strategy.totalAssets.gte(before.strategy.totalAssets.add(minUnderlying)),
        "total assets"
      )
      assert(
        after.strategy.totalDebt.eq(before.strategy.totalDebt.add(depositAmount)),
        "total debt"
      )
      assert(after.gauge.strategy.gte(before.gauge.strategy.add(minLp)), "min gauge")
    })
  })
}
