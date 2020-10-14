const BN = require("bn.js")
const {chai.expect} = require("../setup")
const {eq, add} = require("../util")
const setup = require("./setup")

contract("integration", (accounts) => {
  const refs = setup(accounts)
  const {admin} = refs

  let controller
  let vault
  let strategy
  let underlying
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

  it("should withdraw all", async () => {
    const amount = await underlying.balanceOf(strategy.address)
    const min = amount

    const before = await snapshot()
    await controller.withdrawAll(strategy.address, min, {from: admin})
    const after = await snapshot()

    // check strategy transferred underlying token back to vault
    assert(eq(after.underlying.vault, add(before.underlying.vault, amount)), "vault")

    // check strategy balance is zero
    assert(eq(after.underlying.strategy, new BN(0)), "strategy")
  })

  it("should reject if not authorized", async () => {
    const amount = await underlying.balanceOf(strategy.address)
    const min = amount

    await chai.expect(
      controller.withdrawAll(strategy.address, min, {from: accounts[1]})
    ).to.be.rejectedWith("!authorized")
  })

  it("should reject if transferred amount < min", async () => {
    const amount = await underlying.balanceOf(strategy.address)
    const min = amount.add(new BN(1))

    await chai.expect(
      controller.withdrawAll(strategy.address, min, {from: accounts[1]})
    ).to.be.rejectedWith("!authorized")
  })
})
