import BN from "bn.js"
import { StrategyStEthInstance } from "../../../types"
import { frac, pow } from "../../util"
import { getSnapshot } from "./lib"
import _setup from "./setup"

contract("StrategyStEth", (accounts) => {
  const DEPOSIT_AMOUNT = pow(10, 18)

  const refs = _setup(accounts)
  const { vault } = refs

  let strategy: StrategyStEthInstance
  beforeEach(async () => {
    strategy = refs.strategy
    await strategy.deposit({ from: vault, value: DEPOSIT_AMOUNT })
  })

  it("should withdraw all", async () => {
    const snapshot = getSnapshot(refs)

    const before = await snapshot()
    await strategy.withdrawAll({ from: vault })
    const after = await snapshot()

    // minimum amount of underlying that must be withdrawn + tx fee
    const minEth = frac(before.strategy.totalAssets, 95, 100)

    // check balance of eth transferred to vault
    assert(after.eth.vault.gte(before.eth.vault.add(minEth)), "eth vault")
    // check total debt
    assert(after.strategy.totalDebt.eq(new BN(0)), "total debt")
    // check strategy does not have any eth
    assert(after.eth.strategy.eq(new BN(0)), "eth strategy")
    // check strategy dust is small
    assert(after.lp.strategy.lte(new BN(100)), "lp strategy")
    // check strategy does not have any lp in gauge
    assert(after.gauge.strategy.eq(new BN(0)), "gauge strategy")
  })
})
