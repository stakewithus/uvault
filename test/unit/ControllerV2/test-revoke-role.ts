import chai from "chai"
import { ControllerV2Instance } from "../../../types"
import _setup from "./setup"

contract("Controller", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let controller: ControllerV2Instance
  beforeEach(() => {
    controller = refs.controller
  })

  describe("revokeRole", () => {
    const addr = accounts[1]

    beforeEach(async () => {
      const adminRole = await controller.ADMIN_ROLE()
      await controller.grantRole(adminRole, addr, { from: admin })

      const harvesterRole = await controller.ADMIN_ROLE()
      await controller.grantRole(harvesterRole, addr, { from: admin })
    })

    it("should revoke admin role", async () => {
      const adminRole = await controller.ADMIN_ROLE()
      await controller.revokeRole(adminRole, addr, { from: admin })

      assert.equal(await controller.hasRole(adminRole, addr), false, "admin role")
    })

    it("should revoke harvester role", async () => {
      const harvesterRole = await controller.ADMIN_ROLE()
      await controller.revokeRole(harvesterRole, addr, { from: admin })

      assert.equal(await controller.hasRole(harvesterRole, addr), false, "admin role")
    })

    it("should reject if caller not admin", async () => {
      const adminRole = await controller.ADMIN_ROLE()

      await chai
        .expect(controller.revokeRole(adminRole, addr, { from: accounts[1] }))
        .to.be.rejectedWith("!admin")
    })
  })
})
