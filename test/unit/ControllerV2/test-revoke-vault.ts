import chai from "chai"
import { ControllerV2Instance, MockVaultInstance } from "../../../types"
import _setup from "./setup"

const MockVault = artifacts.require("MockVault")

contract("Controller", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let controller: ControllerV2Instance
  let vault: MockVaultInstance
  beforeEach(async () => {
    controller = refs.controller
    vault = await MockVault.new(
      refs.controller.address,
      refs.timeLock.address,
      refs.underlying.address
    )
  })

  describe("revokeVault", () => {
    it("should revoke vault", async () => {
      await controller.approveVault(vault.address, { from: admin })

      const tx = await controller.revokeVault(vault.address, { from: admin })

      assert.equal(await controller.vaults(vault.address), false, "vault")

      const log = tx.logs[0]
      assert.equal(log.event, "ApproveVault", "log name")
      // @ts-ignore
      assert.equal(log.args.vault, vault.address, "log vault")
      // @ts-ignore
      assert.equal(log.args.approved, false, "log approved")
    })

    it("should reject if not approved", async () => {
      await chai
        .expect(controller.revokeVault(vault.address, { from: admin }))
        .to.be.rejectedWith("!approved vault")
    })

    it("should reject if caller not admin", async () => {
      await controller.approveVault(vault.address, { from: admin })

      await chai
        .expect(controller.revokeVault(vault.address, { from: accounts[1] }))
        .to.be.rejectedWith("!admin")
    })
  })
})
