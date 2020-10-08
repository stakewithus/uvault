const BN = require("bn.js")
const {assert} = require("chai")
const {expect} = require("../../setup")
const {ZERO_ADDRESS} = require("../../util")
const setup = require("./setup")

const BaseStrategy = artifacts.require("BaseStrategy")

contract("BaseStrategy", (accounts) => {
  const refs = setup(accounts)
  const {admin} = refs

  let vault
  let controller
  beforeEach(() => {
    vault = refs.vault
    controller = refs.controller
  })

  describe("constructor", () => {
    it("should deploy", async () => {
      const strategy = await BaseStrategy.new(controller.address, vault.address)

      assert.equal(await strategy.admin(), admin, "admin")
      assert.equal(await strategy.controller(), controller.address, "controller")
      assert.equal(await strategy.vault(), vault.address, "vault")
    })

    it("should not deploy if controller is zero address", async () => {
      await expect(BaseStrategy.new(ZERO_ADDRESS, vault.address)).to.be.rejectedWith(
        "controller = zero address"
      )
    })

    it("should not deploy if vault is zero address", async () => {
      await expect(
        BaseStrategy.new(controller.address, ZERO_ADDRESS)
      ).to.be.rejectedWith("vault = zero address")
    })
  })
})
