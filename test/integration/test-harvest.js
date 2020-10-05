const {expect} = require("../setup")
const setup = require("./setup")

contract("mainnet integration", (accounts) => {
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
  })

  it("should harvest", async () => {
    await controller.harvest(strategy.address, {from: admin})
    assert(await strategy._harvestWasCalled_(), "harvest")
  })

  it("should reject if not authorized", async () => {
    await expect(
      controller.harvest(strategy.address, {from: accounts[1]})
    ).to.be.rejectedWith("!authorized")
  })
})
