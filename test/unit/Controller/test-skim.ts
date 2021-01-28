import BN from "bn.js"
import chai from "chai"
import {
  ControllerInstance,
  StrategyERC20TestInstance,
  MockERC20VaultInstance,
} from "../../../types"
import _setup from "./setup"

contract("Controller", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let controller: ControllerInstance
  let strategy: StrategyERC20TestInstance
  let vault: MockERC20VaultInstance
  beforeEach(async () => {
    controller = refs.controller
    strategy = refs.strategyErc20
    vault = refs.erc20Vault

    await vault.setStrategy(strategy.address, new BN(0))
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

    it("should reject if strategy not approved", async () => {
      await controller.revokeStrategy(strategy.address, { from: admin })

      await chai
        .expect(controller.skim(strategy.address, { from: admin }))
        .to.be.rejectedWith("!approved strategy")
    })

    it("should reject invalid strategy address", async () => {
      // mock strategy address
      const strategy = accounts[1]
      await controller.approveStrategy(strategy, { from: admin })

      await chai.expect(controller.skim(strategy, { from: admin })).to.be.rejected
    })
  })
})
