const {expect} = require("../../setup")
const {ZERO_ADDRESS} = require("../../util")
const setup = require("./setup")

contract("Vault", (accounts) => {
  const MIN_WAIT_TIME = 0

  const refs = setup(accounts, MIN_WAIT_TIME)
  const {admin} = refs

  let vault
  let erc20
  beforeEach(() => {
    vault = refs.vault
    erc20 = refs.erc20
  })

  describe("setController", () => {
    it("should set controller", async () => {
      await vault.setController(accounts[1], {from: admin})

      assert.equal(await vault.controller(), accounts[1])
    })

    it("should reject if caller not controller", async () => {
      await expect(
        vault.setController(accounts[1], {from: accounts[1]})
      ).to.be.rejectedWith("!admin")
    })

    it("should reject zero address", async () => {
      await expect(vault.setController(ZERO_ADDRESS, {from: admin})).to.be.rejectedWith(
        "controller = zero address"
      )
    })
  })
})
