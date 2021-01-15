import BN from "bn.js"
import {
  IERC20Instance,
  ControllerV2Instance,
  StableSwapAaveInstance,
  LiquidityGaugeV2Instance,
} from "../../../types"
import { frac, pow } from "../../util"
import { StrategyInstance, Setup, getSnapshot } from "./lib"

export default (name: string, _setup: Setup, params: { DECIMALS: BN }) => {
  contract(name, (accounts) => {
    const { DECIMALS } = params
    const DEPOSIT_AMOUNT = pow(10, DECIMALS).mul(new BN(1000000))

    const refs = _setup(accounts)
    const { vault, whale } = refs

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

    it("should withdraw", async () => {
      const snapshot = getSnapshot(refs)

      const withdrawAmount = frac(await strategy.totalAssets(), 50, 100)

      const before = await snapshot()
      await strategy.withdraw(withdrawAmount, { from: vault })
      const after = await snapshot()

      // minimum amount of underlying that must be withdrawn
      const minUnderlying = frac(withdrawAmount, 99, 100)

      // check balance of underlying transferred to vault
      assert(
        after.underlying.vault.gte(before.underlying.vault.add(minUnderlying)),
        "underlying vault"
      )
      assert(
        after.strategy.totalDebt.lte(before.strategy.totalDebt.sub(minUnderlying)),
        "total debt"
      )
      assert(
        after.strategy.totalAssets.lte(before.strategy.totalAssets.sub(minUnderlying)),
        "total assets"
      )
      assert(after.gauge.strategy.lt(before.gauge.strategy), "gauge strategy")
    })
  })
}
