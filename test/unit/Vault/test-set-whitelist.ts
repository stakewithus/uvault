import chai from "chai"
import {VaultInstance} from "../../../types/Vault"
import _setup from "./setup"

contract("Vault", (accounts) => {
  const refs = _setup(accounts)
  const {admin} = refs

  let vault: VaultInstance
  beforeEach(() => {
    vault = refs.vault
  })

  describe("setWhitelist", () => {
    const addr = accounts[1]

    it("should approve", async () => {
      await vault.setWhitelist(addr, true, {from: admin})
      assert.equal(await vault.whitelist(addr), true, "whitelist")
    })

    it("should revoke", async () => {
      await vault.setWhitelist(addr, true, {from: admin})
      await vault.setWhitelist(addr, false, {from: admin})
      assert.equal(await vault.whitelist(addr), false, "whitelist")
    })

    it("should reject if caller not admin", async () => {
      await chai
        .expect(vault.setWhitelist(addr, true, {from: accounts[1]}))
        .to.be.rejectedWith("!admin")
    })
  })
})
