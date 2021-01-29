import chai from "chai"
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

contract("integration - withdraw all", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let underlying: TestTokenInstance
  let controller: ControllerInstance
  let erc20Vault: ERC20VaultInstance
  let ethVault: ETHVaultInstance
  let strategyErc20: StrategyERC20TestInstance
  let strategyEth: StrategyETHTestInstance
  beforeEach(async () => {
    underlying = refs.underlying
    controller = refs.controller
    erc20Vault = refs.erc20Vault
    ethVault = refs.ethVault
    strategyErc20 = refs.strategyErc20
    strategyEth = refs.strategyEth

    // force strategy balance > 0
    await underlying._mint_(strategyErc20.address, 100)
    await strategyEth.sendTransaction({ from: admin, value: 100 })
  })

  describe("erc20", () => {
    const snapshot = async () => {
      return {
        underlying: {
          erc20Vault: await underlying.balanceOf(erc20Vault.address),
          strategyErc20: await underlying.balanceOf(strategyErc20.address),
        },
        erc20Vault: {
          balanceInStrategy: await erc20Vault.balanceInStrategy(),
        },
      }
    }

    it("should withdraw", async () => {
      const amount = await strategyErc20.totalAssets()
      const min = amount

      const before = await snapshot()
      await controller.withdraw(strategyErc20.address, amount, min, { from: admin })
      const after = await snapshot()

      // check strategy transferred underlying token back to vault
      assert(
        eq(
          after.underlying.erc20Vault,
          before.underlying.erc20Vault.add(before.erc20Vault.balanceInStrategy)
        ),
        "vault"
      )

      // check strategy balance is zero
      assert(eq(after.underlying.strategyErc20, new BN(0)), "strategy")
      assert(eq(after.erc20Vault.balanceInStrategy, new BN(0)), "balance in strategy")
    })

    it("should reject if transferred amount < min", async () => {
      const amount = await strategyErc20.totalAssets()
      const min = amount.add(new BN(1))

      await chai
        .expect(
          controller.withdraw(strategyErc20.address, amount, min, { from: admin })
        )
        .to.be.rejectedWith("withdraw < min")
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
          balanceInStrategy: await ethVault.balanceInStrategy(),
        },
      }
    }

    it("should withdraw", async () => {
      const amount = await strategyEth.totalAssets()
      const min = amount

      const before = await snapshot()
      await controller.withdraw(strategyEth.address, amount, min, { from: admin })
      const after = await snapshot()

      // check strategy transferred underlying token back to vault
      assert(
        eq(
          after.eth.ethVault,
          before.eth.ethVault.add(before.ethVault.balanceInStrategy)
        ),
        "vault"
      )

      // check strategy balance is zero
      assert(eq(after.eth.strategyEth, new BN(0)), "strategy")
      assert(eq(after.ethVault.balanceInStrategy, new BN(0)), "balance in strategy")
    })

    it("should reject if transferred amount < min", async () => {
      const amount = await strategyEth.totalAssets()
      const min = amount.add(new BN(1))

      await chai
        .expect(controller.withdraw(strategyEth.address, amount, min, { from: admin }))
        .to.be.rejectedWith("withdraw < min")
    })
  })
})
