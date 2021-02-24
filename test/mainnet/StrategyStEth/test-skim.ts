import BN from "bn.js"
import { StrategyStEthInstance } from "../../../types"
import { pow, frac, lte } from "../../util"
import { getSnapshot } from "./lib"
import _setup from "./setup"

contract("StrategyStEth", (accounts) => {
  const DEPOSIT_AMOUNT = pow(10, 18).mul(new BN(100))

  const refs = _setup(accounts)
  const { admin, vault } = refs

  let strategy: StrategyStEthInstance
  beforeEach(async () => {
    strategy = refs.strategy

    await strategy.deposit({ from: vault, value: DEPOSIT_AMOUNT })

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
    if (lte(await strategy.totalAssets(), max)) {
      console.log("Skipping test: total assets <= max")
      return
    }

    const before = await snapshot()
    await strategy.skim({ from: admin })
    const after = await snapshot()

    assert(after.strategy.totalDebt.eq(before.strategy.totalDebt), "total debt")
    assert(after.strategy.totalAssets.lt(before.strategy.totalAssets), "total assets")
    assert(after.eth.vault.gt(before.eth.vault), "vault")
  })
})
