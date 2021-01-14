import chai from "chai"
import {
  TestTokenInstance,
  ControllerV2Instance,
  VaultInstance,
  StrategyTestV2Instance,
} from "../../types"
import _setup from "./setup"

const StrategyTestV2 = artifacts.require("StrategyTestV2")

contract("integration - skim", (accounts) => {
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

  it("should skim", async () => {
    const min = 0
    const max = await strategy.totalAssets()

    await controller.skim(strategy.address, min, max, { from: admin })
  })

  it("should reject if not currenty strategy", async () => {
    const min = 0
    const max = await strategy.totalAssets()

    const newStrategy = await StrategyTestV2.new(
      controller.address,
      vault.address,
      underlying.address
    )
    await chai
      .expect(controller.skim(newStrategy.address, min, max, { from: admin }))
      .to.be.rejectedWith("!strategy")
  })

  it("should reject if not authorized", async () => {
    const min = 0
    const max = await strategy.totalAssets()

    await chai
      .expect(controller.skim(strategy.address, min, max, { from: accounts[1] }))
      .to.be.rejectedWith("!authorized")
  })
})
