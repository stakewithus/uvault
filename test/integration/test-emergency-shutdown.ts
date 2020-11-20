import chai from "chai"
import BN from "bn.js"
import {
  TestTokenInstance,
  ControllerInstance,
  VaultInstance,
  StrategyTestInstance,
  StrategyNoOpInstance,
} from "../../types"
import _setup from "./setup"

contract("integration - emergency shutdown and recovery", (accounts) => {
  const refs = _setup(accounts)
  const { admin, timeLock } = refs

  let controller: ControllerInstance
  let vault: VaultInstance
  let strategy: StrategyTestInstance
  let strategyNoOp: StrategyNoOpInstance
  let underlying: TestTokenInstance
  beforeEach(async () => {
    controller = refs.controller
    vault = refs.vault
    strategy = refs.strategy
    strategyNoOp = refs.strategyNoOp
    underlying = refs.underlying

    // invest into current strategy
    await controller.invest(vault.address, { from: admin })
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

  it("should shutdown", async () => {
    const min = await vault.balanceInStrategy()

    const before = await snapshot()
    await vault.setPause(true, { from: admin })
    await controller.setStrategy(vault.address, strategyNoOp.address, min, {
      from: admin,
    })
    const after = await snapshot()

    // check strategy transferred all underlying token back to vault
    assert(
      after.underlying.vault.eq(
        before.underlying.vault.add(before.vault.balanceInStrategy)
      ),
      "vault"
    )
    // check strategy balance is zero
    assert(after.underlying.strategy.eq(new BN(0)), "strategy")
    // check vault.strategy
    assert.equal(after.vault.strategy, strategyNoOp.address, "strategy no op")
  })

  it("should recover", async () => {
    const min = await vault.balanceInStrategy()

    // shutdown
    await vault.setPause(true, { from: admin })
    await controller.setStrategy(vault.address, strategyNoOp.address, min, {
      from: admin,
    })

    const before = await snapshot()
    await controller.setStrategy(vault.address, strategy.address, 0, {
      from: admin,
    })
    await vault.setPause(false, { from: admin })
    const after = await snapshot()

    // check vault.strategy
    assert.equal(after.vault.strategy, strategy.address, "strategy")
  })
})
