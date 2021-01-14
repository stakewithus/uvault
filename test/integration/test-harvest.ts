import chai from "chai"
import {
  TestTokenInstance,
  ControllerV2Instance,
  VaultInstance,
  StrategyTestV2Instance,
} from "../../types"
import _setup from "./setup"

const StrategyTest = artifacts.require("StrategyTest")

contract("integration - harvest", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let controller: ControllerV2Instance
  let vault: VaultInstance
  let strategy: StrategyTestV2Instance
  let underlying: TestTokenInstance
  beforeEach(async () => {
    controller = refs.controller
    vault = refs.vault
    strategy = refs.strategy
    underlying = refs.underlying
  })

  it("should harvest", async () => {
    await controller.harvest(strategy.address, { from: admin })
    assert(await strategy._harvestWasCalled_(), "harvest")
  })

  it("should reject if not currenty strategy", async () => {
    const strategy = await StrategyTest.new(
      controller.address,
      vault.address,
      underlying.address
    )
    await chai
      .expect(controller.harvest(strategy.address, { from: admin }))
      .to.be.rejectedWith("!strategy")
  })

  it("should reject if not authorized", async () => {
    await chai
      .expect(controller.harvest(strategy.address, { from: accounts[1] }))
      .to.be.rejectedWith("!authorized")
  })
})
