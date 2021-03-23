import BN from "bn.js"
import { pow } from "../../util"
import { StrategyCompLevEthInstance } from "../../../types"
import _setup from "./setup"
import { getSnapshot } from "./lib"

contract("StrategyCompLevEth", (accounts) => {
  const DEPOSIT_AMOUNT = pow(10, 18).mul(new BN(10))

  const refs = _setup(accounts)
  const { admin, vault } = refs

  let strategy: StrategyCompLevEthInstance
  beforeEach(async () => {
    strategy = refs.strategy

    // deposit eth into strategy
    await strategy.deposit({ from: vault, value: DEPOSIT_AMOUNT })
  })

  it("should harvest", async () => {
    const snapshot = getSnapshot(refs)

    const before = await snapshot()
    await strategy.harvest({ from: admin })
    const after = await snapshot()

    assert(after.eth.treasury.gt(before.eth.treasury), "eth treasury")
    assert(after.eth.strategy.gte(before.eth.strategy), "eth strategy")
    assert(
      after.strategy.totalAssets.gte(before.strategy.totalAssets),
      "strategy total assets"
    )
  })
})
