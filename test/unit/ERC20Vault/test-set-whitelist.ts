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

  describe("setWhitelist", () => {
    const addr = accounts[1]

    it("should approve", async () => {
      const tx = await vault.setWhitelist(addr, true, { from: admin })

      assert.equal(await vault.whitelist(addr), true, "whitelist")

      // check log
      assert.equal(tx.logs[0].event, "SetWhitelist", "event")
      assert.equal(
        // @ts-ignore
        tx.logs[0].args.addr,
        addr,
        "log addr"
      )
      assert.equal(
        // @ts-ignore
        tx.logs[0].args.approved,
        true,
        "log approved"
      )
    })

    it("should revoke", async () => {
      await vault.setWhitelist(addr, true, { from: admin })
      await vault.setWhitelist(addr, false, { from: admin })
      assert.equal(await vault.whitelist(addr), false, "whitelist")
    })

    it("should reject if caller not admin", async () => {
      await chai
        .expect(vault.setWhitelist(addr, true, { from: accounts[1] }))
        .to.be.rejectedWith("!admin")
    })
  })
})
