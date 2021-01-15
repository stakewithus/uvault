import BN from "bn.js"
import {
  IERC20Instance,
  ControllerV2Instance,
  StableSwapAaveInstance,
  LiquidityGaugeV2Instance,
} from "../../../types"
import { pow } from "../../util"
import { StrategyInstance, Setup, getSnapshot } from "./lib"

export default (name: string, _setup: Setup, params: { DECIMALS: BN }) => {
  contract(name, (accounts) => {
    const { DECIMALS } = params
    const DEPOSIT_AMOUNT = pow(10, DECIMALS).mul(new BN(1000000))

    const refs = _setup(accounts)
    const { admin, vault, whale } = refs

    let underlying: IERC20Instance
    let lp: IERC20Instance
    let stableSwap: StableSwapAaveInstance
    let gauge: LiquidityGaugeV2Instance
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
    })

    it("should harvest", async () => {
      const snapshot = getSnapshot(refs)

      const before = await snapshot()
      await strategy.harvest({ from: admin })
      const after = await snapshot()

      assert(
        after.underlying.treasury.gte(before.underlying.treasury),
        "underlying treasury"
      )
      assert(
        after.strategy.totalAssets.gt(before.strategy.totalAssets),
        "strategy total assets"
      )
      assert(after.gauge.strategy.gt(before.gauge.strategy), "gauge strategy")
      // Check CRV was liquidated
      assert(after.crv.strategy.eq(new BN(0)), "crv strategy")
    })
  })
}
