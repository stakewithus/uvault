import BN from "bn.js"
import { StrategyCompLevEthInstance } from "../../../types"
import { pow, frac } from "../../util"
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

  it("should withdraw all", async () => {
    const snapshot = getSnapshot(refs)

    const before = await snapshot()
    await strategy.withdrawAll({ from: vault })
    const after = await snapshot()

    // minimum amount of eth that must be withdrawn
    const minEth = frac(before.strategy.totalAssets, 99, 100)
    // supplied dust
    const dust = frac(DEPOSIT_AMOUNT, 1, 1000000)

    // check balance of eth transferred to vault
    assert(after.eth.vault.gte(before.eth.vault.add(minEth)), "eth vault")
    // check total debt
    assert(after.strategy.totalDebt.eq(new BN(0)), "total debt")
    // check strategy does not have any eth
    assert(after.eth.strategy.eq(new BN(0)), "eth strategy")
    assert(after.eth.vault.gt(before.eth.vault), "eth vault")
    // check supplied dust is small
    assert(after.strategy.supplied.lte(dust), "supplied strategy")
    assert(after.strategy.borrowed.eq(new BN(0)), "supplied strategy")
    // check cToken dust is small
    assert(after.cToken.strategy.lte(new BN(10 ** 4)), "cToken strategy")
  })
})
