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

  describe("unauthorize", () => {
    const addr = accounts[1]

    beforeEach(async () => {
      await controller.authorize(addr, {from: admin})
    })

    it("should unauthorize", async () => {
      await controller.unauthorize(addr, {from: admin})

      assert.equal(await controller.authorized(addr), false, "authorized")
    })

    it("should reject if caller not admin", async () => {
      await chai
        .expect(controller.unauthorize(addr, {from: accounts[1]}))
        .to.be.rejectedWith("!admin")
    })
  })
})
