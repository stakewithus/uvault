import BN from "bn.js"
import { IERC20Instance } from "../../../types"
import { pow, frac } from "../../util"
import { StrategyInstance, Setup, getSnapshot } from "./lib"

export default (name: string, _setup: Setup, params: { DECIMALS: BN }) => {
  contract(name, (accounts) => {
    const { DECIMALS } = params
    const DEPOSIT_AMOUNT = pow(10, DECIMALS).mul(new BN(100))

    const refs = _setup(accounts)
    const { vault, whale } = refs

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
    })

    it("should exit", async () => {
      const snapshot = getSnapshot(refs)

      const before = await snapshot()
      await strategy.exit({ from: vault })
      const after = await snapshot()

      const dust = frac(DEPOSIT_AMOUNT, 1, 1000000)

      // check strategy dust is small
      assert(after.underlying.strategy.eq(new BN(0)), "underlying strategy")
      assert(after.underlying.vault.gt(before.underlying.vault), "underlying vault")
      assert(after.strategy.totalDebt.eq(new BN(0)), "total debt")
      assert(after.strategy.supplied.lte(dust), "supplied")
      assert(after.strategy.borrowed.eq(new BN(0)), "borrowed")
      assert(after.cToken.strategy.lte(new BN(10)), "cToken")
    })
  })
}
