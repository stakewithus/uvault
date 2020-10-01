const BN = require("bn.js")
const {expect} = require("../../setup")
const {eq} = require("../../util")
const setup = require("./setup")

contract("Controller", (accounts) => {
  const refs = setup(accounts)
  const {admin, gasRelayer} = refs

  let controller
  let vault
  beforeEach(() => {
    controller = refs.controller
    vault = refs.vault
  })

  const min = new BN(10)

  describe("rebalance", () => {
    it("should rebalance admin", async () => {
      await controller.rebalance(vault.address, min, {from: admin})

      assert(await vault._rebalanceWasCalled_(), "rebalance")
      assert(eq(await vault._rebalanceMin_(), min), "min")
    })

    it("should rebalance gas relayer", async () => {
      await controller.rebalance(vault.address, min, {from: gasRelayer})

      assert(await vault._rebalanceWasCalled_(), "rebalance")
    })

    it("should reject if caller not authorized", async () => {
      await expect(
        controller.rebalance(vault.address, min, {from: accounts[1]})
      ).to.be.rejectedWith("!authorized")
    })

    it("should reject invalid vault address", async () => {
      await expect(controller.rebalance(accounts[1], min, {from: admin})).to.be.rejected
    })
  })
})
