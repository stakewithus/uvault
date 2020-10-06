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

  describe("unpause", () => {
    beforeEach(async () => {
      await vault.pause({from: admin})
    })

    it("should unpause", async () => {
      await vault.unpause({from: admin})
      assert.isFalse(await vault.paused(), "!paused")
    })

    it("should reject if caller not admin", async () => {
      await expect(vault.unpause({from: accounts[1]})).to.be.rejectedWith("!admin")
    })

    it("should reject if not paused", async () => {
      await vault.unpause({from: admin})
      await expect(vault.unpause({from: admin})).to.be.rejectedWith("!paused")
    })
  })
})
