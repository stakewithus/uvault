import { StrategyStEthInstance } from "../../../types"
import { frac, pow } from "../../util"
import _setup from "./setup"
import { getSnapshot } from "./lib"

contract("StrategyStEth", (accounts) => {
  const refs = _setup(accounts)
  const { vault } = refs

  let strategy: StrategyStEthInstance
  beforeEach(() => {
    strategy = refs.strategy
  })

  it("should deposit", async () => {
    const DEPOSIT_AMOUNT = pow(10, 18)

    const snapshot = getSnapshot(refs)

    const before = await snapshot()
    await strategy.deposit({ from: vault, value: DEPOSIT_AMOUNT })
    const after = await snapshot()

    // minimum amount of eth that can be withdrawn
    const minEth = frac(DEPOSIT_AMOUNT, 99, 100)
    // minimum amount of lp minted
    const minLp = frac(
      DEPOSIT_AMOUNT.mul(pow(10, 18).div(before.stableSwap.virtualPrice)),
      99,
      100
    )

    // eth transferred from vault to strategy
    assert(after.eth.vault.lte(before.eth.vault.sub(DEPOSIT_AMOUNT)), "eth vault")
    assert(
      after.strategy.totalAssets.gte(before.strategy.totalAssets.add(minEth)),
      "total assets"
    )
    assert(
      after.strategy.totalDebt.eq(before.strategy.totalDebt.add(DEPOSIT_AMOUNT)),
      "total debt"
    )
    assert(after.gauge.strategy.gte(before.gauge.strategy.add(minLp)), "min gauge")
  })
})
