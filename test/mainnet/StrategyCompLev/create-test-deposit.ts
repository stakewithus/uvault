import BN from "bn.js"
import { IERC20Instance } from "../../../types"
import { frac, pow } from "../../util"
import { StrategyInstance, Setup, getSnapshot } from "./lib"

export default (name: string, _setup: Setup, params: { DECIMALS: BN }) => {
  contract(name, (accounts) => {
    const refs = _setup(accounts)
    const { vault, whale } = refs

    const { DECIMALS } = params

    let underlying: IERC20Instance
    let strategy: StrategyInstance
    beforeEach(() => {
      underlying = refs.underlying
      strategy = refs.strategy
    })

    it("should deposit", async () => {
      const DEPOSIT_AMOUNT = pow(10, DECIMALS).mul(new BN(1000000))

      // transfer underlying to vault
      await underlying.transfer(vault, DEPOSIT_AMOUNT, { from: whale })

      // approve strategy to spend underlying from vault
      await underlying.approve(strategy.address, DEPOSIT_AMOUNT, { from: vault })

      const snapshot = getSnapshot(refs)

      const before = await snapshot()
      await strategy.deposit(DEPOSIT_AMOUNT, { from: vault })
      const after = await snapshot()

      const minUnderlying = frac(DEPOSIT_AMOUNT, 9999, 10000)

      const { 3: safeCol } = await strategy.getLivePosition.call() // use static call
      // 1 / (1 - safeCol)
      const maxLev = pow(10, 36).div(pow(10, 18).sub(safeCol))
      const minSupplied = frac(maxLev.mul(DEPOSIT_AMOUNT).div(pow(10, 18)), 98, 100)

      // underlying transferred from vault to strategy
      assert(
        after.underlying.vault.eq(before.underlying.vault.sub(DEPOSIT_AMOUNT)),
        "underlying vault"
      )
      assert(
        after.strategy.totalAssets.gte(before.strategy.totalAssets.add(minUnderlying)),
        "total assets"
      )
      assert(
        after.strategy.totalDebt.eq(before.strategy.totalDebt.add(DEPOSIT_AMOUNT)),
        "total debt"
      )
      assert(after.strategy.supplied.gte(minSupplied), "supplied")
    })
  })
}
