import chai from "chai"
import BN from "bn.js"
import { TestTokenInstance, ETHVaultInstance } from "../../../types"
import _setup from "./setup"

const TestToken = artifacts.require("TestToken")

contract("ETHVault", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  const amount = new BN(123)

  let vault: ETHVaultInstance
  let token: TestTokenInstance
  beforeEach(async () => {
    vault = refs.vault
    // create token != vault.token
    token = await TestToken.new()
    await token._mint_(vault.address, amount)
  })

  describe("sweep", () => {
    it("should withdraw token from vault", async () => {
      const snapshot = async () => {
        return {
          token: {
            admin: await token.balanceOf(admin),
            vault: await token.balanceOf(vault.address),
          },
        }
      }

      const before = await snapshot()
      await vault.sweep(token.address, { from: admin })
      const after = await snapshot()

      // check token balance
      assert.equal(
        after.token.admin.eq(before.token.admin.add(amount)),
        true,
        "token admin"
      )
      assert.equal(
        after.token.vault.eq(before.token.vault.sub(amount)),
        true,
        "token vault"
      )
    })

    it("should reject if not admin", async () => {
      await chai
        .expect(vault.sweep(token.address, { from: accounts[1] }))
        .to.be.rejectedWith("!admin")
    })
  })
})
