import BN from "bn.js"
import { StrategyStEthInstance } from "../../../types"
import { pow } from "../../util"
import { getSnapshot } from "./lib"
import _setup from "./setup"

contract("StrategyStEth", (accounts) => {
  const DEPOSIT_AMOUNT = pow(10, 18)

  const refs = _setup(accounts)
  const { admin, vault } = refs

  let strategy: StrategyStEthInstance
  beforeEach(async () => {
    strategy = refs.strategy
    await strategy.deposit({ from: vault, value: DEPOSIT_AMOUNT })
  })

  it("should harvest", async () => {
    const snapshot = getSnapshot(refs)

    const before = await snapshot()
    await strategy.harvest({ from: admin })
    const after = await snapshot()

    assert(after.eth.treasury.gte(before.eth.treasury), "eth treasury")
    assert(
      after.strategy.totalAssets.gt(before.strategy.totalAssets),
      "strategy total assets"
    )
    assert(after.gauge.strategy.gt(before.gauge.strategy), "gauge strategy")
    // Check CRV was liquidated
    assert(after.crv.strategy.eq(new BN(0)), "crv strategy")
  })
})
