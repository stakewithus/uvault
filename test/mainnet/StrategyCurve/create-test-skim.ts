import BN from "bn.js"
import { IERC20Instance, ControllerInstance, GaugeInstance } from "../../../types"
import { pow } from "../../util"
import { StrategyInstance, Setup, getSnapshot } from "./lib"

export default (name: string, _setup: Setup, params: { DECIMALS: BN }) => {
  contract(name, (accounts) => {
    const { DECIMALS } = params
    const DEPOSIT_AMOUNT = pow(10, DECIMALS).mul(new BN(1000000))

    const refs = _setup(accounts)
    const { admin, vault, treasury, whale } = refs

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
      // harvest to create some profit
      await strategy.harvest({ from: admin })
    })

    it("should skim", async () => {
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
      // @ts-ignore
      await strategy.skim()
      const after = await snapshot()

      // check profit was transferred to vault
      assert(after.underlying.vault.gte(before.underlying.vault), "underlying vault")

      if (before.strategy.totalAssets.gte(before.strategy.totalDebt)) {
        assert(
          after.strategy.totalAssets.lte(before.strategy.totalAssets),
          "total assets"
        )
      }

      assert(after.strategy.totalDebt.lte(before.strategy.totalDebt), "total debt")
    })
  })
}
