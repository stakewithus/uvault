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

contract("integration - exit", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let controller: ControllerInstance
  let vault: VaultInstance
  let strategy: StrategyTestInstance
  let underlying: TestTokenInstance
  beforeEach(async () => {
    controller = refs.controller
    vault = refs.vault
    strategy = refs.strategy
    underlying = refs.underlying

    // invest
    await controller.invest(vault.address, { from: admin })
  })

  const snapshot = async () => {
    return {
      underlying: {
        vault: await underlying.balanceOf(vault.address),
        strategy: await underlying.balanceOf(strategy.address),
      },
      vault: {
        balanceInStrategy: await vault.balanceInStrategy(),
      },
    }
  }

  it("should exit", async () => {
    const min = await underlying.balanceOf(strategy.address)

    const before = await snapshot()
    await controller.exit(strategy.address, min, { from: admin })
    const after = await snapshot()

    // check strategy transferred all underlying token back to vault
    assert(
      eq(
        after.underlying.vault,
        before.underlying.vault.add(before.vault.balanceInStrategy)
      ),
      "vault"
    )
    // check strategy balance is zero
    assert(eq(after.underlying.strategy, new BN(0)), "strategy")
  })

  it("should reject if not currenty strategy", async () => {
    const strategy = await StrategyTest.new(
      controller.address,
      vault.address,
      underlying.address
    )
    await chai
      .expect(controller.exit(strategy.address, 0, { from: admin }))
      .to.be.rejectedWith("!strategy")
  })

  it("should reject if not authorized", async () => {
    const amount = await underlying.balanceOf(strategy.address)
    const min = amount

    await chai
      .expect(controller.exit(strategy.address, min, { from: accounts[1] }))
      .to.be.rejectedWith("!authorized")
  })

  it("should reject if transferred amount < min", async () => {
    const amount = await strategy.totalAssets()
    const min = add(amount, 1)

    await chai
      .expect(controller.exit(strategy.address, min, { from: accounts[1] }))
      .to.be.rejectedWith("!authorized")
  })
})
