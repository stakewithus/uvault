import BN from "bn.js"
import chai from "chai"
import {
  ControllerInstance,
  StrategyTestInstance,
  MockVaultInstance,
} from "../../../types"
import _setup from "./setup"

contract("Controller", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let controller: ControllerInstance
  let strategy: StrategyTestInstance
  let vault: MockVaultInstance
  beforeEach(() => {
    controller = refs.controller
    strategy = refs.strategy
    vault = refs.vault
  })

  describe("skim", () => {
    it("should skim", async () => {
      await controller.skim(strategy.address, { from: admin })
    })

    it("should reject if not current strategy", async () => {
      // mock strategy address
      await vault.setStrategy(accounts[1], new BN(0))

      await chai
        .expect(controller.skim(strategy.address, { from: admin }))
        .to.be.rejectedWith("!strategy")
    })

    it("should reject if caller not authorized", async () => {
      await chai
        .expect(controller.skim(strategy.address, { from: accounts[1] }))
        .to.be.rejectedWith("!authorized")
    })

    it("should reject invalid strategy address", async () => {
      await chai.expect(controller.skim(accounts[1], { from: admin })).to.be.rejected
    })
  })
})
