import chai from "chai"
import { ControllerInstance } from "../../../types"
import _setup from "./setup"

contract("Controller", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let controller: ControllerInstance
  beforeEach(() => {
    controller = refs.controller
  })

  describe("grantRole", () => {
    it("should grant admin role", async () => {
      const adminRole = await controller.ADMIN_ROLE()
      await controller.grantRole(adminRole, accounts[1], { from: admin })

      assert.equal(await controller.hasRole(adminRole, accounts[1]), true, "admin role")
    })

    it("should grant harvester role", async () => {
      const harvesterRole = await controller.HARVESTER_ROLE()
      await controller.grantRole(harvesterRole, accounts[1], { from: admin })

      assert.equal(
        await controller.hasRole(harvesterRole, accounts[1]),
        true,
        "harvester role"
      )
    })

    it("should reject if caller not admin", async () => {
      const adminRole = await controller.ADMIN_ROLE()

      await chai
        .expect(controller.grantRole(adminRole, accounts[1], { from: accounts[1] }))
        .to.be.rejectedWith("!admin")
    })
  })
})
