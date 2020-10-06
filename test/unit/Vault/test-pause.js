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

  describe("pause", () => {
    it("should pause", async () => {
      await vault.pause({from: admin})
      assert(await vault.paused(), "paused")
    })

    it("should reject if caller not admin", async () => {
      await expect(vault.pause({from: accounts[1]})).to.be.rejectedWith("!admin")
    })

    it("should reject if paused", async () => {
      await vault.pause({from: admin})
      await expect(vault.pause({from: admin})).to.be.rejectedWith("paused")
    })
  })
})
