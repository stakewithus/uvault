const {expect} = require("../../setup")
const {ZERO_ADDRESS} = require("../../util")
const setup = require("./setup")

contract("Controller", (accounts) => {
  const refs = setup(accounts)
  const {admin} = refs

  let controller
  let strategy
  beforeEach(() => {
    controller = refs.controller
    strategy = refs.strategy
  })

  describe("setAdmin", () => {
    it("should set admin", async () => {
      await controller.setAdmin(accounts[1], {from: admin})

      assert.equal(await controller.admin(), accounts[1])
    })

    it("should reject if caller not admin", async () => {
      await expect(
        controller.setAdmin(accounts[1], {from: accounts[1]})
      ).to.be.rejectedWith("!admin")
    })

    it("should reject zero address", async () => {
      await expect(controller.setAdmin(ZERO_ADDRESS, {from: admin})).to.be.rejectedWith(
        "admin = zero address"
      )
    })
  })
})
