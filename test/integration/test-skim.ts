import {
  ControllerV2Instance,
  StrategyTestV2Instance,
  TestTokenInstance,
} from "../../types"
import _setup from "./setup"

contract("integration - skim", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let controller: ControllerV2Instance
  let strategy: StrategyTestV2Instance
  let underlying: TestTokenInstance
  beforeEach(async () => {
    controller = refs.controller
    strategy = refs.strategy
    underlying = refs.underlying

    // force total underlying to be > debt
    await underlying._mint_(strategy.address, 100)
  })

  it("should skim", async () => {
    await controller.skim(strategy.address, { from: admin })
  })
})
