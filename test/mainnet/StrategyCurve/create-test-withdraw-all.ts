import BN from "bn.js"
import { IERC20Instance, ControllerInstance, GaugeInstance } from "../../../types"
import { frac, pow } from "../../util"
import { StrategyInstance, Setup, getSnapshot } from "./lib"

export default (name: string, _setup: Setup, params: { DECIMALS: BN }) => {
  contract(name, (accounts) => {
    const { DECIMALS } = params
    const DEPOSIT_AMOUNT = pow(10, DECIMALS).mul(new BN(1000000))

    const refs = _setup(accounts)
    const { vault, treasury, whale } = refs

    let underlying: IERC20Instance
    let lp: IERC20Instance
    let gauge: GaugeInstance
    let crv: IERC20Instance
    let controller: ControllerInstance
    let strategy: StrategyInstance
    beforeEach(async () => {
      underlying = refs.underlying
      lp = refs.lp
      gauge = refs.gauge
      crv = refs.crv
      controller = refs.controller
      strategy = refs.strategy

      // deposit underlying into vault
      await underlying.transfer(vault, DEPOSIT_AMOUNT, { from: whale })

      // deposit underlying into strategy
      await underlying.approve(strategy.address, DEPOSIT_AMOUNT, { from: vault })
      await strategy.deposit(DEPOSIT_AMOUNT, { from: vault })
    })

    it("should withdraw all", async () => {
      const snapshot = getSnapshot({
        underlying,
        lp,
        gauge,
        crv,
        strategy,
        treasury,
        vault,
      })

      const before = await snapshot()
      await strategy.withdrawAll({ from: vault })
      const after = await snapshot()

      // minimum amount of underlying that must be withdrawn
      const minUnderlying = frac(before.strategy.totalAssets, 99, 100)

      // check balance of underlying transferred to vault
      assert(
        after.underlying.vault.gte(before.underlying.vault.add(minUnderlying)),
        "underlying vault"
      )
      // check total debt
      assert(after.strategy.totalDebt.eq(new BN(0)), "total debt")
      // check strategy does not have any underlying
      assert(after.underlying.strategy.eq(new BN(0)), "underlying strategy")
      // check strategy dust is small
      assert(after.lp.strategy.lte(new BN(100)), "lp strategy")
      // check strategy does not have any lp in gauge
      assert(after.gauge.strategy.eq(new BN(0)), "gauge strategy")
    })
  })
}
