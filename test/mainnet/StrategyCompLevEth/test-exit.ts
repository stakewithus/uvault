import BN from "bn.js"
import { StrategyCompLevEthInstance } from "../../../types"
import { frac, pow } from "../../util"
import _setup from "./setup"
import { getSnapshot } from "./lib"

contract("StrategyCompLevEth", (accounts) => {
  const DEPOSIT_AMOUNT = pow(10, 18).mul(new BN(10))

  const refs = _setup(accounts)
  const { vault } = refs

  let strategy: StrategyCompLevEthInstance
  beforeEach(async () => {
    strategy = refs.strategy

    await strategy.deposit({ from: vault, value: DEPOSIT_AMOUNT })
  })

  it("should exit", async () => {
    const snapshot = getSnapshot(refs)

    const before = await snapshot()
    await strategy.exit({ from: vault })
    const after = await snapshot()

    const dust = frac(pow(10, 18), 1, 1000)

    // check strategy dust is small
    assert(after.eth.strategy.eq(new BN(0)), "eth strategy")
    assert(after.eth.vault.gt(before.eth.vault), "eth vault")
    assert(after.strategy.totalDebt.eq(new BN(0)), "total debt")
    assert(after.strategy.supplied.lte(dust), "supplied")
    assert(after.strategy.borrowed.eq(new BN(0)), "borrowed")
    assert(after.cToken.strategy.lte(new BN(10 ** 4)), "cToken")
  })
})
