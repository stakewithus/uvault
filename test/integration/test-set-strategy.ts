import BN from "bn.js"
import {
  TestTokenInstance,
  ControllerInstance,
  ERC20VaultInstance,
  ETHVaultInstance,
  StrategyERC20TestInstance,
  StrategyETHTestInstance,
} from "../../types"
import { eq, add } from "../util"
import _setup from "./setup"

const StrategyERC20Test = artifacts.require("StrategyERC20Test")
const StrategyETHTest = artifacts.require("StrategyETHTest")

contract("integration - set strategy", (accounts) => {
  const refs = _setup(accounts)
  const { admin, timeLock } = refs

  let underlying: TestTokenInstance
  let controller: ControllerInstance
  let erc20Vault: ERC20VaultInstance
  let ethVault: ETHVaultInstance
  let strategyErc20: StrategyERC20TestInstance
  let newStrategyErc20: StrategyERC20TestInstance
  let strategyEth: StrategyETHTestInstance
  let newStrategyEth: StrategyETHTestInstance
  beforeEach(async () => {
    underlying = refs.underlying
    controller = refs.controller
    erc20Vault = refs.erc20Vault
    strategyErc20 = refs.strategyErc20
    ethVault = refs.ethVault
    strategyEth = refs.strategyEth

    // invest into current strategy
    await controller.invest(erc20Vault.address, { from: admin })
    await controller.invest(ethVault.address, { from: admin })

    // new stratgy
    newStrategyErc20 = await StrategyERC20Test.new(
      controller.address,
      erc20Vault.address,
      underlying.address,
      {
        from: admin,
      }
    )

    newStrategyEth = await StrategyETHTest.new(controller.address, ethVault.address, {
      from: admin,
    })

    await erc20Vault.approveStrategy(newStrategyErc20.address, { from: timeLock })
    await ethVault.approveStrategy(newStrategyEth.address, { from: timeLock })
  })

  describe("erc20", () => {
    const snapshot = async () => {
      return {
        erc20Vault: {
          strategy: await erc20Vault.strategy(),
          balanceInStrategy: await erc20Vault.balanceInStrategy(),
        },
        underlying: {
          erc20Vault: await underlying.balanceOf(erc20Vault.address),
          strategyErc20: await underlying.balanceOf(strategyErc20.address),
        },
      }
    }

    it("should set strategy", async () => {
      const min = await erc20Vault.balanceInStrategy()

      const before = await snapshot()
      await controller.setStrategy(erc20Vault.address, newStrategyErc20.address, min, {
        from: admin,
      })
      const after = await snapshot()

      // check strategy transferred all underlying token back to vault
      assert(
        eq(
          after.underlying.erc20Vault,
          add(before.underlying.erc20Vault, before.erc20Vault.balanceInStrategy)
        ),
        "vault"
      )
      // check strategy balance is zero
      assert(eq(after.underlying.strategyErc20, new BN(0)), "strategy")
      // check vault.strategy
      assert.equal(after.erc20Vault.strategy, newStrategyErc20.address, "new strategy")
    })
  })

  describe("eth", () => {
    const snapshot = async () => {
      return {
        ethVault: {
          strategy: await ethVault.strategy(),
          balanceInStrategy: await ethVault.balanceInStrategy(),
        },
        eth: {
          ethVault: new BN(await web3.eth.getBalance(ethVault.address)),
          strategyEth: new BN(await web3.eth.getBalance(strategyEth.address)),
        },
      }
    }

    it("should set strategy", async () => {
      const min = await ethVault.balanceInStrategy()

      const before = await snapshot()
      await controller.setStrategy(ethVault.address, newStrategyEth.address, min, {
        from: admin,
      })
      const after = await snapshot()

      // check strategy transferred all underlying token back to vault
      assert(
        eq(
          after.eth.ethVault,
          add(before.eth.ethVault, before.ethVault.balanceInStrategy)
        ),
        "vault"
      )
      // check strategy balance is zero
      assert(eq(after.eth.strategyEth, new BN(0)), "strategy")
      // check vault.strategy
      assert.equal(after.ethVault.strategy, newStrategyEth.address, "new strategy")
    })
  })
})
