const {expect} = require("../../setup")
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

  describe("setMin", () => {
    it("should set min", async () => {
      await vault.setMin(123, {from: admin})

      assert.equal(await vault.min(), 123)
    })

    it("should reject if caller not admin", async () => {
      await expect(vault.setMin(123, {from: accounts[1]})).to.be.rejectedWith("!admin")
    })

    it("should reject min > max", async () => {
      await expect(vault.setMin(10001, {from: admin})).to.be.rejectedWith("min > max")
    })
  })
})
