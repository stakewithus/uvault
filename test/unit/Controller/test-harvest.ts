import BN from "bn.js"
import chai from "chai"
import {
  ControllerInstance,
  StrategyERC20TestInstance,
  MockVaultInstance,
} from "../../../types"
import _setup from "./setup"

contract("Controller", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let controller: ControllerInstance
  let strategy: StrategyERC20TestInstance
  let vault: MockVaultInstance
  beforeEach(async () => {
    controller = refs.controller
    strategy = refs.strategy
    vault = refs.vault

    await vault.setStrategy(strategy.address, new BN(0))
  })

  describe("harvest", () => {
    it("should harvest", async () => {
      await controller.harvest(strategy.address, { from: admin })
      assert(await strategy._harvestWasCalled_(), "harvest")
    })

    it("should reject if not current strategy", async () => {
      // mock strategy address
      await vault.setStrategy(accounts[1], new BN(0))
      await chai
        .expect(controller.harvest(strategy.address, { from: admin }))
        .to.be.rejectedWith("!strategy")
    })

    it("should reject if caller not authorized", async () => {
      await chai
        .expect(controller.harvest(strategy.address, { from: accounts[1] }))
        .to.be.rejectedWith("!authorized")
    })

    it("should reject if strategy not approved", async () => {
      await controller.revokeStrategy(strategy.address, { from: admin })

      await chai
        .expect(controller.harvest(strategy.address, { from: admin }))
        .to.be.rejectedWith("!approved strategy")
    })

    it("should reject invalid strategy address", async () => {
      // mock strategy address
      const strategy = accounts[1]
      await controller.approveStrategy(strategy, { from: admin })

      await chai.expect(controller.harvest(strategy, { from: admin })).to.be.rejected
    })
  })
})
