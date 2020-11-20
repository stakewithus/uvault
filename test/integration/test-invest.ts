import chai from "chai"
import {
  TestTokenInstance,
  ControllerInstance,
  VaultInstance,
  StrategyTestInstance,
} from "../../types"
import { eq, sub, ZERO_ADDRESS } from "../util"
import _setup from "./setup"

const Vault = artifacts.require("Vault")

contract("integration", (accounts) => {
  const refs = _setup(accounts)
  const { admin, timeLock } = refs

  let controller: ControllerInstance
  let vault: VaultInstance
  let strategy: StrategyTestInstance
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

  it("should reject if not authorized", async () => {
    await chai
      .expect(controller.invest(vault.address, { from: accounts[1] }))
      .to.be.rejectedWith("!authorized")
  })

  it("should reject if not currenty strategy", async () => {
    const vault = await Vault.new(controller.address, timeLock, underlying.address)
    assert.equal(await vault.strategy(), ZERO_ADDRESS, "strategy")

    await chai
      .expect(controller.invest(vault.address, { from: admin }))
      .to.be.rejectedWith("strategy = zero address")
  })
})
