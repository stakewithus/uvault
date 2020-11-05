import chai from "chai"
import {ControllerInstance} from "../../../types/Controller"
import {StrategyTestInstance} from "../../../types/StrategyTest"
import _setup from "./setup"

contract("Controller", (accounts) => {
  const refs = _setup(accounts)
  const {admin} = refs

  let controller: ControllerInstance
  let strategy: StrategyTestInstance
  beforeEach(() => {
    controller = refs.controller
    strategy = refs.strategy
  })

  describe("skim", () => {
    it("should skim", async () => {
      await controller.skim(strategy.address, {from: admin})
    })

    it("should reject if caller not authorized", async () => {
      await chai
        .expect(controller.skim(strategy.address, {from: accounts[1]}))
        .to.be.rejectedWith("!authorized")
    })

    it("should reject invalid strategy address", async () => {
      await chai.expect(controller.skim(accounts[1], {from: admin})).to.be.rejected
    })
  })
})
