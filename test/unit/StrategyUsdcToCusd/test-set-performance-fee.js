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

  describe("setPerformanceFee", () => {
    const fee = 500

    it("should set performance fee", async () => {
      await strategy.setPerformanceFee(fee, {from: admin})

      assert.equal(await strategy.performanceFee(), fee)
    })

    it("should reject if caller not admin", async () => {
      await expect(
        strategy.setPerformanceFee(fee, {from: accounts[1]})
      ).to.be.rejectedWith("!admin")
    })

    it("should reject fee > max", async () => {
      await expect(strategy.setPerformanceFee(10001, {from: admin})).to.be.rejectedWith(
        "performance fee > max"
      )
    })
  })
})
