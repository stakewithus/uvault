import BN from "bn.js"
import chai from "chai"
import {
  ControllerV2Instance,
  StrategyTestInstance,
  MockVaultInstance,
} from "../../../types"
import _setup from "./setup"

contract("Controller", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let controller: ControllerV2Instance
  let strategy: StrategyTestInstance
  let vault: MockVaultInstance
  beforeEach(async () => {
    controller = refs.controller
    strategy = refs.strategyV1
    vault = refs.vault

    await vault.setStrategy(strategy.address, new BN(0))
  })

  describe("harvest (v1)", () => {
    const func = "harvest(address)"

    it("should harvest", async () => {
      await controller.methods[func](strategy.address, { from: admin })
      assert(await strategy._harvestWasCalled_(), "harvest")
    })

    it("should reject if not current strategy", async () => {
      // mock strategy address
      await vault.setStrategy(accounts[1], new BN(0))
      await chai
        .expect(controller.methods[func](strategy.address, { from: admin }))
        .to.be.rejectedWith("!strategy")
    })

    it("should reject if caller not authorized", async () => {
      await chai
        .expect(controller.methods[func](strategy.address, { from: accounts[1] }))
        .to.be.rejectedWith("!authorized")
    })

    it("should reject invalid strategy address", async () => {
      await chai.expect(controller.methods[func](accounts[1], { from: admin })).to.be
        .rejected
    })
  })
})
