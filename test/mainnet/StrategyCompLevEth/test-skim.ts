import BN from "bn.js"
import { StrategyCompLevEthInstance } from "../../../types"
import { pow, lte, sendEther } from "../../util"
import _setup from "./setup"
import { getSnapshot } from "./lib"

contract("StrategyCompLevEth", (accounts) => {
  const DEPOSIT_AMOUNT = pow(10, 18).mul(new BN(10))

  const refs = _setup(accounts)
  const { admin, vault } = refs

  let strategy: StrategyCompLevEthInstance
  beforeEach(async () => {
    strategy = refs.strategy

    await strategy.deposit({ from: vault, value: DEPOSIT_AMOUNT })
    // create profit
    await sendEther(web3, admin, strategy.address, 1)
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
    assert(after.eth.vault.eq(before.eth.vault), "vault")
  })
})
