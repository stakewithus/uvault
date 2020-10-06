const BN = require("bn.js")
const {expect} = require("../../setup")
const {eq} = require("../../util")
const setup = require("./setup")

contract("Vault", (accounts) => {
  const MIN_WAIT_TIME = 0

  const refs = setup(accounts, MIN_WAIT_TIME)
  const {admin} = refs

  let vault
  beforeEach(() => {
    vault = refs.vault
  })

  const fee = new BN(1)

  describe("setInvestFee", () => {
    it("should set invest fee", async () => {
      await vault.setInvestFee(fee, {from: admin})

      assert(eq(await vault.investFee(), fee), "invest fee")
    })

    it("should reject if caller not admin", async () => {
      await expect(vault.setInvestFee(fee, {from: accounts[1]})).to.be.rejectedWith(
        "!admin"
      )
    })

    it("should reject min > max", async () => {
      await expect(vault.setInvestFee(501, {from: admin})).to.be.rejectedWith(
        "invest fee > cap"
      )
    })
  })
})
