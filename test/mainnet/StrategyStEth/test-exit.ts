import BN from "bn.js"
import { StrategyStEthInstance } from "../../../types"
import { pow, frac, lte } from "../../util"
import { getSnapshot } from "./lib"
import _setup from "./setup"

contract("StrategyStEth", (accounts) => {
  const DEPOSIT_AMOUNT = pow(10, 18).mul(new BN(100))
  const DUST = frac(DEPOSIT_AMOUNT, 1, 1000)

  const refs = _setup(accounts)
  const { vault } = refs

  let strategy: StrategyStEthInstance
  beforeEach(async () => {
    strategy = refs.strategy
    await strategy.deposit({ from: vault, value: DEPOSIT_AMOUNT })
  })

  it("should exit", async () => {
    const snapshot = getSnapshot(refs)

    const before = await snapshot()
    await strategy.exit({ from: vault })
    const after = await snapshot()

    assert(after.gauge.strategy.eq(new BN(0)), "gauge strategy")
    // check strategy dust is small
    assert(after.lp.strategy.lte(new BN(100)), "lp strategy")
    assert(after.eth.strategy.eq(new BN(0)), "eth strategy")
    assert(after.crv.strategy.eq(new BN(0)), "crv strategy")
    assert(after.strategy.totalDebt.lte(DUST), "total debt")
    assert(after.eth.vault.gte(before.eth.vault), "eth vault")
  })
})
