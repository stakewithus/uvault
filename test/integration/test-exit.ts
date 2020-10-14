import chai from "chai"
import BN from "bn.js"
import {Erc20TokenInstance} from "../../types/Erc20Token"
import {ControllerInstance} from "../../types/Controller"
import {VaultInstance} from "../../types/Vault"
import {StrategyTestInstance} from "../../types/StrategyTest"
import {eq, add } from "../util"
import _setup from "./setup"

contract("integration", (accounts) => {
  const refs = _setup(accounts)
  const {admin} = refs

  let controller: ControllerInstance
  let vault: VaultInstance
  let strategy: StrategyTestInstance
  let underlying: Erc20TokenInstance
  beforeEach(async () => {
    controller = refs.controller
    vault = refs.vault
    strategy = refs.strategy
    underlying = refs.underlying

    // invest
    await controller.invest(vault.address, {from: admin})
  })

  const snapshot = async () => {
    return {
      underlying: {
        vault: await underlying.balanceOf(vault.address),
        strategy: await underlying.balanceOf(strategy.address),
      },
    }
  }

  it("should exit", async () => {
    const min = await underlying.balanceOf(strategy.address)

    const before = await snapshot()
    await controller.exit(strategy.address, min, {from: admin})
    const after = await snapshot()

    // check strategy transferred all underlying token back to vault
    assert(
      eq(
        after.underlying.vault,
        add(before.underlying.vault, before.underlying.strategy)
      ),
      "vault"
    )
    // check strategy balance is zero
    assert(eq(after.underlying.strategy, new BN(0)), "strategy")
  })

  it("should reject if not authorized", async () => {
    const amount = await underlying.balanceOf(strategy.address)
    const min = amount

    await chai.expect(
      controller.exit(strategy.address, min, {from: accounts[1]})
    ).to.be.rejectedWith("!authorized")
  })

  it("should reject if transferred amount < min", async () => {
    const amount = await underlying.balanceOf(strategy.address)
    const min = add(amount, 1)

    await chai.expect(
      controller.exit(strategy.address, min, {from: accounts[1]})
    ).to.be.rejectedWith("!authorized")
  })
})
