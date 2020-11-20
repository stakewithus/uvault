import chai from "chai"
import { ControllerInstance } from "../../../types/Controller"
import { StrategyTestInstance } from "../../../types/StrategyTest"
import { ZERO_ADDRESS } from "../../util"
import _setup from "./setup"

contract("Controller", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let controller: ControllerInstance
  let strategy: StrategyTestInstance
  beforeEach(() => {
    controller = refs.controller
    strategy = refs.strategy
  })

  describe("setAdmin", () => {
    it("should set admin", async () => {
      await controller.setAdmin(accounts[1], { from: admin })

      assert.equal(await controller.admin(), accounts[1])

      const ADMIN_ROLE = await controller.ADMIN_ROLE()
      const HARVESTER_ROLE = await controller.HARVESTER_ROLE()

      assert.equal(
        await controller.hasRole(ADMIN_ROLE, admin),
        false,
        "revoke admin role"
      )
      assert.equal(
        await controller.hasRole(HARVESTER_ROLE, admin),
        false,
        "revoke harvester role"
      )
      assert.equal(
        await controller.hasRole(ADMIN_ROLE, accounts[1]),
        true,
        "grant admin role"
      )
      assert.equal(
        await controller.hasRole(HARVESTER_ROLE, accounts[1]),
        true,
        "grant harvester role"
      )
    })

    it("should reject if caller not admin", async () => {
      await chai
        .expect(controller.setAdmin(accounts[1], { from: accounts[1] }))
        .to.be.rejectedWith("!admin")
    })

    it("should reject zero address", async () => {
      await chai
        .expect(controller.setAdmin(ZERO_ADDRESS, { from: admin }))
        .to.be.rejectedWith("admin = zero address")
    })
  })
})
