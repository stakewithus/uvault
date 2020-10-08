const {expect} = require("../../setup")
const {ZERO_ADDRESS} = require("../../util")
const setup = require("./setup")

contract("StrategyUsdcToCusd", (accounts) => {
  const refs = setup(accounts)
  const {admin} = refs

  let strategy
  beforeEach(() => {
    strategy = refs.strategy
  })

  describe("setAdmin", () => {
    it("should set admin", async () => {
      await strategy.setAdmin(accounts[1], {from: admin})

      assert.equal(await strategy.admin(), accounts[1])
    })

    it("should reject if caller not admin", async () => {
      await expect(
        strategy.setAdmin(accounts[1], {from: accounts[1]})
      ).to.be.rejectedWith("!admin")
    })

    it("should reject zero address", async () => {
      await expect(strategy.setAdmin(ZERO_ADDRESS, {from: admin})).to.be.rejectedWith(
        "admin = zero address"
      )
    })
  })
})
