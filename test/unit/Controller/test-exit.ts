import BN from "bn.js"
import chai from "chai"
import {
  ControllerInstance,
  MockERC20VaultInstance,
  MockETHVaultInstance,
  StrategyERC20TestInstance,
  StrategyETHTestInstance,
} from "../../../types"
import { add } from "../../util"
import _setup from "./setup"

contract("Controller", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let controller: ControllerInstance
  let erc20Vault: MockERC20VaultInstance
  let ethVault: MockETHVaultInstance
  let strategyErc20: StrategyERC20TestInstance
  let strategyEth: StrategyETHTestInstance
  beforeEach(() => {
    controller = refs.controller
    erc20Vault = refs.erc20Vault
    ethVault = refs.ethVault
    strategyErc20 = refs.strategyErc20
    strategyEth = refs.strategyEth
  })

  describe("exit", () => {
    describe("erc20", () => {
      it("should exit", async () => {
        await controller.exit(strategyErc20.address, 0, { from: admin })
      })

      it("should reject if not current strategy", async () => {
        // mock strategy address
        await erc20Vault.setStrategy(accounts[1], new BN(0))

        await chai
          .expect(controller.exit(strategyErc20.address, 0, { from: admin }))
          .to.be.rejectedWith("!strategy")
      })

      it("should reject if withdraw < min", async () => {
        const bal = await strategyErc20.totalAssets()
        const min = add(bal, 1)

        await chai
          .expect(controller.exit(strategyErc20.address, min, { from: admin }))
          .to.be.rejectedWith("withdraw < min")
      })

      it("should reject if caller not authorized", async () => {
        await chai
          .expect(controller.exit(strategyErc20.address, 0, { from: accounts[1] }))
          .to.be.rejectedWith("!authorized")
      })

      it("should reject if strategy not approved", async () => {
        await controller.revokeStrategy(strategyErc20.address, { from: admin })

        await chai
          .expect(controller.exit(strategyErc20.address, 0, { from: admin }))
          .to.be.rejectedWith("!approved strategy")
      })
    })

    describe("eth", () => {
      it("should exit", async () => {
        await controller.exit(strategyEth.address, 0, { from: admin })
      })

      it("should reject if not current strategy", async () => {
        // mock strategy address
        await ethVault.setStrategy(accounts[1], new BN(0))

        await chai
          .expect(controller.exit(strategyEth.address, 0, { from: admin }))
          .to.be.rejectedWith("!strategy")
      })

      it("should reject if withdraw < min", async () => {
        const bal = await strategyEth.totalAssets()
        const min = add(bal, 1)

        await chai
          .expect(controller.exit(strategyEth.address, min, { from: admin }))
          .to.be.rejectedWith("withdraw < min")
      })

      it("should reject if caller not authorized", async () => {
        await chai
          .expect(controller.exit(strategyEth.address, 0, { from: accounts[1] }))
          .to.be.rejectedWith("!authorized")
      })

      it("should reject if strategy not approved", async () => {
        await controller.revokeStrategy(strategyEth.address, { from: admin })

        await chai
          .expect(controller.exit(strategyEth.address, 0, { from: admin }))
          .to.be.rejectedWith("!approved strategy")
      })
    })

    it("should reject invalid strategy address", async () => {
      // mock strategy address
      const strategy = accounts[1]
      await controller.approveStrategy(strategy, { from: admin })

      await chai.expect(controller.exit(strategy, 0, { from: admin })).to.be.rejected
    })
  })
})
