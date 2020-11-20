import chai from "chai"
import BN from "bn.js"
import {
  TestTokenInstance,
  ControllerInstance,
  VaultInstance,
  StrategyTestInstance,
} from "../../types"
import { eq, add } from "../util"
import _setup from "./setup"

const StrategyTest = artifacts.require("StrategyTest")

contract("integration - set strategy", (accounts) => {
  const refs = _setup(accounts)
  const { admin, timeLock } = refs

  let controller: ControllerInstance
  let vault: VaultInstance
  let strategy: StrategyTestInstance
  let underlying: TestTokenInstance
  let newStrategy: StrategyTestInstance
  beforeEach(async () => {
    controller = refs.controller
    vault = refs.vault
    strategy = refs.strategy
    underlying = refs.underlying

    // invest into current strategy
    await controller.invest(vault.address, { from: admin })

    // new stratgy
    newStrategy = await StrategyTest.new(
      controller.address,
      vault.address,
      underlying.address,
      {
        from: admin,
      }
    )

    await vault.approveStrategy(newStrategy.address, { from: timeLock })
  })

  const snapshot = async () => {
    return {
      vault: {
        strategy: await vault.strategy(),
        balanceInStrategy: await vault.balanceInStrategy(),
      },
      underlying: {
        vault: await underlying.balanceOf(vault.address),
        strategy: await underlying.balanceOf(strategy.address),
      },
    }
  }

  it("should set strategy", async () => {
    const min = await vault.balanceInStrategy()

    const before = await snapshot()
    await controller.setStrategy(vault.address, newStrategy.address, min, {
      from: admin,
    })
    const after = await snapshot()

    // check strategy transferred all underlying token back to vault
    assert(
      eq(
        after.underlying.vault,
        add(before.underlying.vault, before.vault.balanceInStrategy)
      ),
      "vault"
    )
    // check strategy balance is zero
    assert(eq(after.underlying.strategy, new BN(0)), "strategy")
    // check vault.strategy
    assert.equal(after.vault.strategy, newStrategy.address, "new strategy")
  })

  it("should reject if not authorized", async () => {
    await chai
      .expect(
        controller.setStrategy(vault.address, newStrategy.address, new BN(0), {
          from: accounts[1],
        })
      )
      .to.be.rejectedWith("!authorized")
  })
})
