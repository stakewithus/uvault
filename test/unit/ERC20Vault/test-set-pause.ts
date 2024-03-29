import chai from "chai"
import { ERC20VaultInstance } from "../../../types"
import _setup from "./setup"

contract("ERC20Vault", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let vault: ERC20VaultInstance
  beforeEach(() => {
    vault = refs.vault
  })

  describe("setPause", () => {
    it("should pause", async () => {
      await vault.setPause(true, { from: admin })
      assert.equal(await vault.paused(), true, "paused")
    })

    it("should unpause", async () => {
      await vault.setPause(false, { from: admin })
      assert.equal(await vault.paused(), false, "not paused")
    })

    it("should reject if caller not admin", async () => {
      await chai
        .expect(vault.setPause(true, { from: accounts[1] }))
        .to.be.rejectedWith("!admin")
    })
  })
})
