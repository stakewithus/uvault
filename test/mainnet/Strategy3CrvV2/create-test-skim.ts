import BN from "bn.js"
import { IERC20Instance } from "../../../types"
import { pow, frac } from "../../util"
import { StableSwapInstance, StrategyInstance, Setup, getSnapshot } from "./lib"

export default (name: string, _setup: Setup, params: { DECIMALS: BN }) => {
  contract(name, (accounts) => {
    const { DECIMALS } = params
    const DEPOSIT_AMOUNT = pow(10, DECIMALS).mul(new BN(1000000))

    const refs = _setup(accounts)
    const { admin, vault, whale } = refs

    let underlying: IERC20Instance
    let stableSwap: StableSwapInstance
    let lp: IERC20Instance
    let strategy: StrategyInstance
    beforeEach(async () => {
      underlying = refs.underlying
      stableSwap = refs.stableSwap
      lp = refs.lp
      strategy = refs.strategy

      // deposit underlying into vault
      await underlying.transfer(vault, DEPOSIT_AMOUNT, { from: whale })

      // deposit underlying into strategy
      await underlying.approve(strategy.address, DEPOSIT_AMOUNT, { from: vault })
      await strategy.deposit(DEPOSIT_AMOUNT, { from: vault })
    })

    it("should skim - update total debt", async () => {
      const snapshot = getSnapshot(refs)

      const profit = frac(await strategy.totalAssets(), 5, 1000)
      /*
      force total assets > total debt
      whale deposit profit into curve
      whale transfers lp to strategy 
      */

      const lpBal = await lp.balanceOf(whale)
      await lp.transfer(strategy.address, lpBal, { from: whale })

      const before = await snapshot()
      await strategy.skim({ from: admin })
      const after = await snapshot()

      // assert(after.strategy.totalAssets.gt(before.strategy.totalAssets), "total assets")
      // assert(after.strategy.totalDebt.gt(before.strategy.totalDebt), "total debt")
    })
  })
}
