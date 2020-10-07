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

  describe("setRebalanceFee", () => {
    it("should set invest fee", async () => {
      await vault.setRebalanceFee(fee, {from: admin})

      assert(eq(await vault.rebalanceFee(), fee), "rebalance fee")
    })

    it("should reject if caller not admin", async () => {
      await expect(vault.setRebalanceFee(fee, {from: accounts[1]})).to.be.rejectedWith(
        "!admin"
      )
    })

    it("should reject min > max", async () => {
      await expect(vault.setRebalanceFee(501, {from: admin})).to.be.rejectedWith(
        "rebalance fee > cap"
      )
    })
  })
})
