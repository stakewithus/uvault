import BN from "bn.js"
import { IERC20Instance } from "../../../types"
import { pow, frac, gt, lte } from "../../util"
import { StrategyInstance, Setup, getSnapshot } from "./lib"

export default (name: string, _setup: Setup, params: { DECIMALS: BN }) => {
  contract(name, (accounts) => {
    const { DECIMALS } = params
    const DEPOSIT_AMOUNT = pow(10, DECIMALS).mul(new BN(1000000))

    const refs = _setup(accounts)
    const { admin, vault, whale } = refs

    let underlying: IERC20Instance
    let strategy: StrategyInstance
    beforeEach(async () => {
      underlying = refs.underlying
      strategy = refs.strategy

      // deposit underlying into vault
      await underlying.transfer(vault, DEPOSIT_AMOUNT, { from: whale })

      // deposit underlying into strategy
      await underlying.approve(strategy.address, DEPOSIT_AMOUNT, { from: vault })
      await strategy.deposit(DEPOSIT_AMOUNT, { from: vault })

      // force total assets > debt
      // force debt = 0
      await strategy.withdrawAll({ from: admin })
      // force total asset > 0
      await strategy.harvest({ from: admin })
    })

    it("should skim - total assets > max", async () => {
      const snapshot = getSnapshot(refs)

      // calculate max using default delta
      const max = frac(await strategy.totalDebt(), 10050, 10000)
      // assert(gt(await strategy.totalAssets(), max), "total assets <= max")
      if (lte(await strategy.totalAssets(), max)) {
        console.log("skip - total assets <= max")
        return
      }

      const before = await snapshot()
      await strategy.skim({ from: admin })
      const after = await snapshot()

      assert(after.strategy.totalDebt.eq(before.strategy.totalDebt), "total debt")
      assert(after.strategy.totalAssets.lt(before.strategy.totalAssets), "total assets")
      assert(after.underlying.vault.gt(before.underlying.vault), "vault")
    })
  })
}
