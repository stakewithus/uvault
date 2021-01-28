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

  const amount = new BN(1)
  const min = new BN(0)

  describe("withdraw", () => {
    describe("erc20", () => {
      it("should withdraw", async () => {
        const before = await strategyErc20.totalAssets()
        await controller.withdraw(strategyErc20.address, amount, min, {
          from: admin,
        })
        const after = await strategyErc20.totalAssets()

        // check that strategy withdraw was called
        assert(after.lte(before.sub(amount)), "withdraw")
      })

      it("should reject if not current strategy", async () => {
        // mock strategy address
        await erc20Vault.setStrategy(accounts[1], new BN(0))

        await chai
          .expect(
            controller.withdraw(strategyErc20.address, amount, min, { from: admin })
          )
          .to.be.rejectedWith("!strategy")
      })

      it("should reject if withdraw < min", async () => {
        const amount = await strategyErc20.totalAssets()
        const min = add(amount, 1)

        await chai
          .expect(
            controller.withdraw(strategyErc20.address, amount, min, { from: admin })
          )
          .to.be.rejectedWith("withdraw < min")
      })

      it("should reject if caller not authorized", async () => {
        await chai
          .expect(
            controller.withdraw(strategyErc20.address, amount, min, {
              from: accounts[1],
            })
          )
          .to.be.rejectedWith("!authorized")
      })

      it("should reject if strategy not approved", async () => {
        await controller.revokeStrategy(strategyErc20.address, { from: admin })

        await chai
          .expect(
            controller.withdraw(strategyErc20.address, amount, min, { from: admin })
          )
          .to.be.rejectedWith("!approved strategy")
      })
    })

    describe("eth", () => {
      it("should withdraw", async () => {
        const before = await strategyEth.totalAssets()
        await controller.withdraw(strategyEth.address, amount, min, {
          from: admin,
        })
        const after = await strategyEth.totalAssets()

        // check that strategy withdraw was called
        assert(after.lte(before.sub(amount)), "withdraw")
      })

      it("should reject if not current strategy", async () => {
        // mock strategy address
        await ethVault.setStrategy(accounts[1], new BN(0))

        await chai
          .expect(
            controller.withdraw(strategyEth.address, amount, min, { from: admin })
          )
          .to.be.rejectedWith("!strategy")
      })

      it("should reject if withdraw < min", async () => {
        const amount = await strategyEth.totalAssets()
        const min = add(amount, 1)

        await chai
          .expect(
            controller.withdraw(strategyEth.address, amount, min, { from: admin })
          )
          .to.be.rejectedWith("withdraw < min")
      })

      it("should reject if caller not authorized", async () => {
        await chai
          .expect(
            controller.withdraw(strategyEth.address, amount, min, {
              from: accounts[1],
            })
          )
          .to.be.rejectedWith("!authorized")
      })

      it("should reject if strategy not approved", async () => {
        await controller.revokeStrategy(strategyEth.address, { from: admin })

        await chai
          .expect(
            controller.withdraw(strategyEth.address, amount, min, { from: admin })
          )
          .to.be.rejectedWith("!approved strategy")
      })
    })

    it("should reject invalid strategy address", async () => {
      // mock strategy address
      const strategy = accounts[1]
      await controller.approveStrategy(strategy, { from: admin })

      await chai.expect(controller.withdraw(strategy, amount, min, { from: admin })).to
        .be.rejected
    })
  })
})
