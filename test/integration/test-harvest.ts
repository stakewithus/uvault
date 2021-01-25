import { ControllerV2Instance, StrategyTestV2Instance } from "../../types"
import _setup from "./setup"

contract("integration - harvest", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let controller: ControllerV2Instance
  let strategy: StrategyTestV2Instance
  beforeEach(async () => {
    controller = refs.controller
    strategy = refs.strategy
  })

  it("should harvest", async () => {
    await controller.harvest(strategy.address, { from: admin })
    assert(await strategy._harvestWasCalled_(), "harvest")
  })
})
