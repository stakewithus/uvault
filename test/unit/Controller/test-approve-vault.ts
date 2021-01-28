import chai from "chai"
import { ControllerInstance, MockVaultInstance } from "../../../types"
import _setup from "./setup"

const MockVault = artifacts.require("MockVault")

contract("Controller", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let controller: ControllerInstance
  let vault: MockVaultInstance
  beforeEach(async () => {
    controller = refs.controller
    vault = await MockVault.new(
      refs.controller.address,
      refs.timeLock.address,
      refs.underlying.address
    )
  })

  describe("approveVault", () => {
    it("should approve vault", async () => {
      const tx = await controller.approveVault(vault.address, { from: admin })

      assert.equal(await controller.vaults(vault.address), true, "vault")

      const log = tx.logs[0]
      assert.equal(log.event, "ApproveVault", "log name")
      // @ts-ignore
      assert.equal(log.args.vault, vault.address, "log vault")
      // @ts-ignore
      assert.equal(log.args.approved, true, "log approved")
    })

    it("should reject if already approved", async () => {
      await controller.approveVault(vault.address, { from: admin })

      await chai
        .expect(controller.approveVault(vault.address, { from: admin }))
        .to.be.rejectedWith("already approved vault")
    })

    it("should reject if caller not admin", async () => {
      await chai
        .expect(controller.approveVault(vault.address, { from: accounts[1] }))
        .to.be.rejectedWith("!admin")
    })
  })
})
