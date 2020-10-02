const {expect} = require("../../setup")
const setup = require("./setup")

contract("Vault", (accounts) => {
  const MIN_WAIT_TIME = 0

  const refs = setup(accounts, MIN_WAIT_TIME)
  const {admin} = refs

  let vault
  beforeEach(() => {
    vault = refs.vault
  })

  describe("setWithdrawFee", () => {
    it("should set withdraw fee", async () => {
      await vault.setWithdrawFee(123, {from: admin})

      assert.equal(await vault.withdrawFee(), 123)
    })

    it("should reject if caller not admin", async () => {
      await expect(vault.setWithdrawFee(123, {from: accounts[1]})).to.be.rejectedWith(
        "!admin"
      )
    })

    it("should reject min > max", async () => {
      await expect(vault.setWithdrawFee(10001, {from: admin})).to.be.rejectedWith(
        "withdraw fee > max"
      )
    })
  })
})
