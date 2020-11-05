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

  it("should skim", async () => {
    await controller.skim(strategy.address, {from: admin})
  })

  it("should reject if not authorized", async () => {
    await chai
      .expect(controller.skim(strategy.address, {from: accounts[1]}))
      .to.be.rejectedWith("!authorized")
  })
})
