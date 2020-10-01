const {expect} = require("../../setup")
const {eq} = require("../../util")
const setup = require("./setup")
const BN = require("bn.js")

contract("Controller", (accounts) => {
  const refs = setup(accounts)
  const {admin, gasRelayer} = refs

  let controller
  let strategy
  beforeEach(() => {
    controller = refs.controller
    strategy = refs.strategy
  })

  const amount = new BN(1)
  const min = new BN(0)

  describe("withdraw", () => {
    it("should withdraw admin", async () => {
      await controller.withdraw(strategy.address, amount, min, {from: admin})

      assert(eq(await strategy._withdrawAmount_(), amount), "withdraw")
    })

    it("should withdraw gas relayer", async () => {
      await controller.withdraw(strategy.address, amount, min, {from: gasRelayer})

      assert(eq(await strategy._withdrawAmount_(), amount), "withdraw")
    })

    it("should reject if withdraw < min", async () => {
      await expect(
        controller.withdraw(strategy.address, amount, 1, {from: admin})
      ).to.be.rejectedWith("withdraw < min")
    })

    it("should reject if caller not authorized", async () => {
      await expect(
        controller.withdraw(strategy.address, amount, min, {from: accounts[1]})
      ).to.be.rejectedWith("!authorized")
    })

    it("should reject invalid strategy address", async () => {
      await expect(controller.withdraw(accounts[1], amount, min, {from: admin})).to.be
        .rejected
    })
  })
})
