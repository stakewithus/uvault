const {expect} = require("../../setup")
const {ZERO_ADDRESS} = require("../../util")
const setup = require("./setup")

contract("BaseStrategy", (accounts) => {
  const refs = setup(accounts)
  const {admin} = refs

  let strategy
  beforeEach(() => {
    strategy = refs.strategy
  })

  describe("setController", () => {
    it("should set controller", async () => {
      await strategy.setController(accounts[1], {from: admin})

      assert.equal(await strategy.controller(), accounts[1])
    })

    it("should reject if caller not admin", async () => {
      await expect(
        strategy.setController(accounts[1], {from: accounts[1]})
      ).to.be.rejectedWith("!admin")
    })

    it("should reject zero address", async () => {
      await expect(
        strategy.setController(ZERO_ADDRESS, {from: admin})
      ).to.be.rejectedWith("controller = zero address")
    })
  })
})
