import BN from "bn.js"
import { StrategyStEthInstance } from "../../../types"
import { frac, pow } from "../../util"
import { getSnapshot } from "./lib"
import _setup from "./setup"

contract("StrategyStEth", (accounts) => {
  const DEPOSIT_AMOUNT = pow(10, 18).mul(new BN(100))

  const refs = _setup(accounts)
  const { vault } = refs

  let strategy: StrategyStEthInstance
  beforeEach(async () => {
    strategy = refs.strategy
    await strategy.deposit({ from: vault, value: DEPOSIT_AMOUNT })
  })

  it("should withdraw", async () => {
    const snapshot = getSnapshot(refs)

    const withdrawAmount = frac(await strategy.totalAssets(), 50, 100)

    const before = await snapshot()
    await strategy.withdraw(withdrawAmount, { from: vault })
    const after = await snapshot()

    // minimum amount of eth that must be withdrawn + tx fee
    const minEth = frac(withdrawAmount, 95, 100)

    // check balance of eth transferred to vault
    assert(after.eth.vault.gte(before.eth.vault.add(minEth)), "eth vault")
    assert(
      after.strategy.totalDebt.lte(before.strategy.totalDebt.sub(minEth)),
      "total debt"
    )
    assert(
      after.strategy.totalAssets.lte(before.strategy.totalAssets.sub(minEth)),
      "total assets"
    )
    assert(after.gauge.strategy.lt(before.gauge.strategy), "gauge strategy")
  })
})
