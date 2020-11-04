import chai from "chai"
import {ControllerInstance} from "../../types/Controller"
import {StrategyTestInstance} from "../../types/StrategyTest"
import _setup from "./setup"

contract("integration", (accounts) => {
  const refs = _setup(accounts)
  const {admin} = refs

  let controller: ControllerInstance
  let strategy: StrategyTestInstance
  beforeEach(async () => {
    controller = refs.controller
    strategy = refs.strategy
  })

  it("should harvest", async () => {
    await controller.harvest(strategy.address, {from: admin})
    assert(await strategy._harvestWasCalled_(), "harvest")
  })

  it("should reject if not authorized", async () => {
    await chai
      .expect(controller.harvest(strategy.address, {from: accounts[1]}))
      .to.be.rejectedWith("!authorized")
  })
})
