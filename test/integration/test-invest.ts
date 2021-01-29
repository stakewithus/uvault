import BN from "bn.js"
import {
  TestTokenInstance,
  ControllerInstance,
  ERC20VaultInstance,
  ETHVaultInstance,
  StrategyERC20TestInstance,
  StrategyETHTestInstance,
} from "../../types"
import { eq } from "../util"
import _setup from "./setup"

contract("integration - invest", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let underlying: TestTokenInstance
  let controller: ControllerInstance
  let erc20Vault: ERC20VaultInstance
  let ethVault: ETHVaultInstance
  let strategyErc20: StrategyERC20TestInstance
  let strategyEth: StrategyETHTestInstance
  beforeEach(() => {
    underlying = refs.underlying
    controller = refs.controller
    erc20Vault = refs.erc20Vault
    ethVault = refs.ethVault
    strategyErc20 = refs.strategyErc20
    strategyEth = refs.strategyEth
  })

  describe("erc20", () => {
    const snapshot = async () => {
      return {
        underlying: {
          erc20Vault: await underlying.balanceOf(erc20Vault.address),
          strategyErc20: await underlying.balanceOf(strategyErc20.address),
        },
        erc20Vault: {
          availableToInvest: await erc20Vault.availableToInvest(),
          balanceInStrategy: await erc20Vault.balanceInStrategy(),
        },
      }
    }

    it("should invest", async () => {
      const before = await snapshot()
      await controller.invest(erc20Vault.address, { from: admin })
      const after = await snapshot()

      // check underlying was transferred from vault to strategy
      assert(
        eq(
          after.underlying.erc20Vault,
          before.underlying.erc20Vault.sub(before.erc20Vault.availableToInvest)
        ),
        "vault"
      )
      assert(
        after.underlying.strategyErc20.eq(
          before.underlying.strategyErc20.add(before.erc20Vault.availableToInvest)
        ),
        "strategy"
      )
      assert(
        eq(
          after.erc20Vault.balanceInStrategy,
          before.erc20Vault.balanceInStrategy.add(before.erc20Vault.availableToInvest)
        ),
        "balance in strategy"
      )
    })
  })

  describe("eth", () => {
    const snapshot = async () => {
      return {
        eth: {
          ethVault: new BN(await web3.eth.getBalance(ethVault.address)),
          strategyEth: new BN(await web3.eth.getBalance(strategyEth.address)),
        },
        ethVault: {
          availableToInvest: await ethVault.availableToInvest(),
          balanceInStrategy: await ethVault.balanceInStrategy(),
        },
      }
    }

    it("should invest", async () => {
      const before = await snapshot()
      await controller.invest(ethVault.address, { from: admin })
      const after = await snapshot()

      // check underlying was transferred from vault to strategy
      assert(
        eq(
          after.eth.ethVault,
          before.eth.ethVault.sub(before.ethVault.availableToInvest)
        ),
        "vault"
      )
      assert(
        after.eth.strategyEth.eq(
          before.eth.strategyEth.add(before.ethVault.availableToInvest)
        ),
        "strategy"
      )
      assert(
        eq(
          after.ethVault.balanceInStrategy,
          before.ethVault.balanceInStrategy.add(before.ethVault.availableToInvest)
        ),
        "balance in strategy"
      )
    })
  })
})
