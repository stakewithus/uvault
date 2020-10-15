import chai from "chai"
import {ControllerInstance} from "../../../types/Controller"
import _setup from "./setup"

contract("Controller", (accounts) => {
  const refs = _setup(accounts)
  const {admin} = refs

  let controller: ControllerInstance
  beforeEach(() => {
    controller = refs.controller
  })

  describe("authorize", () => {
    it("should authorize", async () => {
      await controller.authorize(accounts[1], {from: admin})

      assert.equal(await controller.authorized(accounts[1]), true, "authorized")
    })

    it("should reject if caller not admin", async () => {
      await chai
        .expect(controller.authorize(accounts[1], {from: accounts[1]}))
        .to.be.rejectedWith("!admin")
    })
  })
})
