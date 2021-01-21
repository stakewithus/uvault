import BN from "bn.js"
import {
  IERC20Instance,
  ControllerV2Instance,
  StableSwap3PoolInstance,
  LiquidityGaugeInstance,
} from "../../../types"
import { pow, frac } from "../../util"
import { StrategyInstance, Setup, getSnapshot } from "./lib"

export default (name: string, _setup: Setup, params: { DECIMALS: BN }) => {
  contract(name, (accounts) => {
    const { DECIMALS } = params
    const DEPOSIT_AMOUNT = pow(10, DECIMALS).mul(new BN(1000000))

    const refs = _setup(accounts)
    const { admin, vault, whale } = refs

    let underlying: IERC20Instance
    let lp: IERC20Instance
    let stableSwap: StableSwap3PoolInstance
    let gauge: LiquidityGaugeInstance
    let crv: IERC20Instance
    let controller: ControllerV2Instance
    let strategy: StrategyInstance
    beforeEach(async () => {
      underlying = refs.underlying
      lp = refs.lp
      stableSwap = refs.stableSwap
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
      const snapshot = getSnapshot(refs)

      const min = frac(await strategy.totalAssets(), 99, 100)
      const max = frac(await strategy.totalAssets(), 101, 100)

      const before = await snapshot()
      await strategy.skim(min, max, { from: admin })
      const after = await snapshot()

      assert(
        after.strategy.totalAssets.gte(before.strategy.totalAssets),
        "total assets"
      )
      assert(after.strategy.totalDebt.gte(before.strategy.totalDebt), "total debt")
    })
  })
}
