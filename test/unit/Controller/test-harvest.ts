import chai from "chai"
import {ControllerInstance} from "../../../types/Controller"
import {StrategyTestInstance} from "../../../types/StrategyTest"
import _setup from "./setup"

contract("Controller", (accounts) => {
  const refs = _setup(accounts)
  const {admin, gasRelayer} = refs

  let controller: ControllerInstance
  let strategy: StrategyTestInstance
  beforeEach(() => {
    controller = refs.controller
    strategy = refs.strategy
  })

  describe("harvest", () => {
    it("should harvest admin", async () => {
      await controller.harvest(strategy.address, {from: admin})

      assert(await strategy._harvestWasCalled_(), "harvest")
    })

    it("should reject if caller not authorized", async () => {
      await chai
        .expect(controller.harvest(strategy.address, {from: accounts[1]}))
        .to.be.rejectedWith("!authorized")
    })

    it("should reject invalid strategy address", async () => {
      await chai.expect(controller.harvest(accounts[1], {from: admin})).to.be.rejected
    })
  })
})
