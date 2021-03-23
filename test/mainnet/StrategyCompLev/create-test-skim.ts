import BN from "bn.js"
import { IERC20Instance } from "../../../types"
import { pow, frac, lte } from "../../util"
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
      // create profit
      await strategy.harvest({ from: admin })
    })

    it("should skim", async () => {
      const snapshot = getSnapshot(refs)

      if (lte(await strategy.totalAssets(), await strategy.totalDebt())) {
        console.log("Skipping test: total assets <= total debt")
        return
      }

      const before = await snapshot()
      await strategy.skim({ from: admin })
      const after = await snapshot()

      assert(after.strategy.totalDebt.gte(before.strategy.totalDebt), "total debt")
      assert(after.underlying.vault.eq(before.underlying.vault), "vault")
    })
  })
}
