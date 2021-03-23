import BN from "bn.js"
import { StrategyCompLevEthInstance } from "../../../types"
import { frac, pow } from "../../util"
import _setup from "./setup"
import { getSnapshot } from "./lib"

contract("StrategyCompLevEth", (accounts) => {
  const refs = _setup(accounts)
  const { vault } = refs

  let strategy: StrategyCompLevEthInstance
  beforeEach(() => {
    strategy = refs.strategy
  })

  it("should deposit", async () => {
    const DEPOSIT_AMOUNT = pow(10, 18).mul(new BN(10))

    const snapshot = getSnapshot(refs)

    const before = await snapshot()
    await strategy.deposit({ from: vault, value: DEPOSIT_AMOUNT })
    const after = await snapshot()

    const minEth = frac(DEPOSIT_AMOUNT, 9999, 10000)
    // 1 / (1 - 0.70) * 0.99
    const minSupplied = frac(DEPOSIT_AMOUNT, 330, 100)

    // eth transferred from vault to strategy
    assert(
      after.strategy.totalAssets.gte(before.strategy.totalAssets.add(minEth)),
      "total assets"
    )
    assert(
      after.strategy.totalDebt.eq(before.strategy.totalDebt.add(DEPOSIT_AMOUNT)),
      "total debt"
    )
    assert(after.strategy.supplied.gte(minSupplied), "supplied")
  })
})
