import {
  TestTokenInstance,
  ControllerV2Instance,
  VaultInstance,
  StrategyTestV2Instance,
} from "../../types"
import { eq, sub } from "../util"
import _setup from "./setup"

contract("integration - invest", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let controller: ControllerV2Instance
  let vault: VaultInstance
  let strategy: StrategyTestV2Instance
  let underlying: TestTokenInstance
  beforeEach(() => {
    underlying = refs.underlying
    controller = refs.controller
    vault = refs.vault
    strategy = refs.strategy
  })

  const snapshot = async () => {
    return {
      underlying: {
        vault: await underlying.balanceOf(vault.address),
        strategy: await underlying.balanceOf(strategy.address),
      },
      vault: {
        availableToInvest: await vault.availableToInvest(),
        balanceInStrategy: await vault.balanceInStrategy(),
      },
    }
  }

  it("should invest", async () => {
    const before = await snapshot()
    await controller.invest(vault.address, { from: admin })
    const after = await snapshot()

    // check underlying was transferred from vault to strategy
    assert(
      eq(
        after.underlying.vault,
        sub(before.underlying.vault, before.vault.availableToInvest)
      ),
      "vault after"
    )
    assert(eq(after.underlying.strategy, before.underlying.strategy), "strategy")
    assert(
      eq(
        after.vault.balanceInStrategy,
        before.vault.balanceInStrategy.add(before.vault.availableToInvest)
      ),
      "balance in strategy"
    )
  })
})
