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

  it("should withdraw", async () => {
    const snapshot = getSnapshot(refs)

    const withdrawAmount = frac(DEPOSIT_AMOUNT, 50, 100)

    const before = await snapshot()
    await strategy.withdraw(withdrawAmount, { from: vault })
    const after = await snapshot()

    // minimum amount of eth that must be withdrawn
    const minEth = frac(withdrawAmount, 99, 100)

    // check balance of eth transferred to vault
    assert(after.eth.vault.gt(before.eth.vault.add(minEth)), "eth vault")
    assert(
      after.strategy.totalDebt.lt(before.strategy.totalDebt.sub(minEth)),
      "total debt"
    )
    assert(
      after.strategy.totalAssets.lt(before.strategy.totalAssets.sub(minEth)),
      "total assets"
    )
    assert(after.strategy.supplied.lt(before.strategy.supplied), "supplied")
    assert(after.strategy.borrowed.lt(before.strategy.borrowed), "borrowed")
  })
})
