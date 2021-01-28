import chai from "chai"
import { ETHVaultInstance } from "../../../types"
import { ZERO_ADDRESS } from "../../util"
import _setup from "./setup"

contract("ETHVault", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let vault: ETHVaultInstance
  beforeEach(() => {
    vault = refs.vault
  })

  describe("setAdmin", () => {
    it("should set admin", async () => {
      await vault.setAdmin(accounts[1], { from: admin })

      assert.equal(await vault.admin(), accounts[1])
    })

    it("should reject if caller not admin", async () => {
      await chai
        .expect(vault.setAdmin(accounts[1], { from: accounts[1] }))
        .to.be.rejectedWith("!admin")
    })

    it("should reject zero address", async () => {
      await chai
        .expect(vault.setAdmin(ZERO_ADDRESS, { from: admin }))
        .to.be.rejectedWith("admin = zero address")
    })
  })
})
