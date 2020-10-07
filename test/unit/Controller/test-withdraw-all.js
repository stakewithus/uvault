const BN = require("bn.js")
const {expect} = require("../../setup")
const setup = require("./setup")

contract("Controller", (accounts) => {
  const refs = setup(accounts)
  const {admin, gasRelayer} = refs

  let controller
  let strategy
  beforeEach(() => {
    controller = refs.controller
    strategy = refs.strategy
  })

  describe("withdrawAll", () => {
    it("should withdrawAll admin", async () => {
      await controller.withdrawAll(strategy.address, 0, {from: admin})

      assert(await strategy._withdrawAllWasCalled_(), "withdraw")
    })

    it("should withdrawAll gas relayer", async () => {
      await controller.withdrawAll(strategy.address, 0, {from: gasRelayer})

      assert(await strategy._withdrawAllWasCalled_(), "withdraw")
    })

    it("should reject if withdraw < min", async () => {
      const bal = await strategy.totalAssets()
      const min = bal.add(new BN(1))

      await expect(
        controller.withdrawAll(strategy.address, min, {from: admin})
      ).to.be.rejectedWith("withdraw < min")
    })

    it("should reject if caller not authorized", async () => {
      await expect(
        controller.withdrawAll(strategy.address, 0, {from: accounts[1]})
      ).to.be.rejectedWith("!authorized")
    })

    it("should reject invalid strategy address", async () => {
      await expect(controller.withdrawAll(accounts[1], 0, {from: admin})).to.be.rejected
    })
  })
})
