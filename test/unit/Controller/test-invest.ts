import chai from "chai"
import {MockVaultInstance} from "../../../types"
import {ControllerInstance} from "../../../types/Controller"
import _setup from "./setup"

contract("Controller", (accounts) => {
  const refs = _setup(accounts)
  const {admin} = refs

  let controller: ControllerInstance
  let vault: MockVaultInstance
  beforeEach(() => {
    controller = refs.controller
    vault = refs.vault
  })

  describe("invest", () => {
    it("should invest admin", async () => {
      await controller.invest(vault.address, {from: admin})

      assert(await vault._investWasCalled_(), "invest")
    })

    it("should reject if caller not authorized", async () => {
      await chai
        .expect(controller.invest(vault.address, {from: accounts[1]}))
        .to.be.rejectedWith("!authorized")
    })

    it("should reject invalid vault address", async () => {
      await chai.expect(controller.invest(accounts[1], {from: admin})).to.be.rejected
    })
  })
})
