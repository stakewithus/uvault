const {chai.expect} = require("../setup")
const {eq, sub, ZERO_ADDRESS} = require("../util")
const setup = require("./setup")

const Vault = artifacts.require("Vault")

contract("integration", (accounts) => {
  const refs = setup(accounts)
  const {admin} = refs

  let underlying
  let controller
  let vault
  let strategy
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
      },
    }
  }

  it("should invest", async () => {
    const before = await snapshot()
    await controller.invest(vault.address, {from: admin})
    const after = await snapshot()

    // check underlying was transferred from vault to strategy
    assert(
      eq(
        after.underlying.vault,
        sub(before.underlying.vault, before.vault.availableToInvest)
      ),
      "vault after"
    )
    assert(eq(after.underlying.strategy, before.vault.availableToInvest), "strategy")
  })

  it("should reject if not authorized", async () => {
    await chai.expect(
      controller.invest(vault.address, {from: accounts[1]})
    ).to.be.rejectedWith("!authorized")
  })

  it("should reject if strategy not set", async () => {
    const vault = await Vault.new(controller.address, underlying.address, 0)
    assert.equal(await vault.strategy(), ZERO_ADDRESS, "strategy")

    await chai.expect(controller.invest(vault.address, {from: admin})).to.be.rejectedWith(
      "strategy = zero address"
    )
  })
})
