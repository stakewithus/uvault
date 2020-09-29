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

  describe("setGasRelayer", () => {
    it("should set gas relayer", async () => {
      await controller.setGasRelayer(accounts[0], {from: admin})

      assert.equal(await controller.gasRelayer(), accounts[0])
    })

    it("should reject if caller not admin", async () => {
      await expect(
        controller.setGasRelayer(accounts[1], {from: accounts[1]})
      ).to.be.rejectedWith("!admin")
    })

    it("should reject zero address", async () => {
      await expect(
        controller.setGasRelayer(ZERO_ADDRESS, {from: admin})
      ).to.be.rejectedWith("gas relayer = zero address")
    })
  })
})
