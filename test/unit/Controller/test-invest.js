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

  describe("invest", () => {
    it("should invest admin", async () => {
      await controller.invest(vault.address, {from: admin})

      assert(await vault._investWasCalled_(), "invest")
    })

    it("should invest gas relayer", async () => {
      await controller.invest(vault.address, {from: gasRelayer})

      assert(await vault._investWasCalled_(), "invest")
    })

    it("should reject if caller not authorized", async () => {
      await expect(
        controller.invest(vault.address, {from: accounts[1]})
      ).to.be.rejectedWith("!authorized")
    })

    it("should reject invalid vault address", async () => {
      await expect(controller.invest(accounts[1], {from: admin})).to.be.rejected
    })
  })
})
