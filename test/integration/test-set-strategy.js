const BN = require("bn.js")
const {chai.expect} = require("../setup")
const {eq, add} = require("../util")
const setup = require("./setup")

const StrategyTest = artifacts.require("StrategyTest")

contract("integration", (accounts) => {
  const refs = setup(accounts)
  const {admin} = refs

  let controller
  let vault
  let strategy
  let underlying
  let newStrategy
  beforeEach(async () => {
    controller = refs.controller
    vault = refs.vault
    strategy = refs.strategy
    underlying = refs.underlying

    // invest into current strategy
    await controller.invest(vault.address, {from: admin})

    // new stratgy
    newStrategy = await StrategyTest.new(
      controller.address,
      vault.address,
      underlying.address,
      {
        from: admin,
      }
    )

    // set next strategy
    await vault.setNextStrategy(newStrategy.address, {from: admin})
  })

  const snapshot = async () => {
    return {
      vault: {
        strategy: await vault.strategy(),
      },
      underlying: {
        vault: await underlying.balanceOf(vault.address),
        strategy: await underlying.balanceOf(strategy.address),
      },
    }
  }

  it("should set strategy", async () => {
    const before = await snapshot()
    await controller.setStrategy(vault.address, newStrategy.address, {from: admin})
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
    // check vault.strategy
    assert.equal(after.vault.strategy, newStrategy.address, "new strategy")
  })

  it("should reject if not authorized", async () => {
    await chai.expect(
      controller.setStrategy(vault.address, newStrategy.address, {
        from: accounts[1],
      })
    ).to.be.rejectedWith("!authorized")
  })
})
