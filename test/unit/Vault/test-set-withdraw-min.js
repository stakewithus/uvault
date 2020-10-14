const {chai.expect} = require("../../setup")
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

  describe("setWithdrawMin", () => {
    it("should set min", async () => {
      await vault.setWithdrawMin(123, {from: admin})

      assert.equal(await vault.withdrawMin(), 123)
    })

    it("should reject if caller not admin", async () => {
      await chai.expect(vault.setWithdrawMin(123, {from: accounts[1]})).to.be.rejectedWith(
        "!admin"
      )
    })

    it("should reject min > max", async () => {
      await chai.expect(vault.setWithdrawMin(10001, {from: admin})).to.be.rejectedWith(
        "withdraw min > max"
      )
    })
  })
})
