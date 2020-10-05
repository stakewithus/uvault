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

  describe("setReserveMin", () => {
    it("should set min", async () => {
      await vault.setReserveMin(123, {from: admin})

      assert.equal(await vault.reserveMin(), 123)
    })

    it("should reject if caller not admin", async () => {
      await expect(vault.setReserveMin(123, {from: accounts[1]})).to.be.rejectedWith(
        "!admin"
      )
    })

    it("should reject min > max", async () => {
      await expect(vault.setReserveMin(10001, {from: admin})).to.be.rejectedWith(
        "reserve min > max"
      )
    })
  })
})
