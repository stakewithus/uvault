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
import { eq, add } from "../util"
import _setup from "./setup"

contract("integration - exit", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let controller: ControllerInstance
  let erc20Vault: ERC20VaultInstance
  let ethVault: ETHVaultInstance
  let strategyErc20: StrategyERC20TestInstance
  let strategyEth: StrategyETHTestInstance
  let underlying: TestTokenInstance
  before(async () => {
    controller = refs.controller
    erc20Vault = refs.erc20Vault
    ethVault = refs.ethVault
    strategyErc20 = refs.strategyErc20
    strategyEth = refs.strategyEth
    underlying = refs.underlying

    // invest
    await controller.invest(erc20Vault.address, { from: admin })
    await controller.invest(ethVault.address, { from: admin })
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

    it("should exit", async () => {
      const min = await erc20Vault.balanceInStrategy()

      const before = await snapshot()
      await controller.exit(strategyErc20.address, min, { from: admin })
      const after = await snapshot()

      // check strategy transferred all underlying token back to vault
      assert(
        eq(
          after.underlying.erc20Vault,
          before.underlying.erc20Vault.add(before.erc20Vault.balanceInStrategy)
        ),
        "vault"
      )
      // check strategy balance is zero
      assert(eq(after.underlying.strategyErc20, new BN(0)), "strategy")
    })

    it("should reject if transferred amount < min", async () => {
      const amount = await strategyErc20.totalAssets()
      const min = add(amount, 1)

      await chai
        .expect(controller.exit(strategyErc20.address, min, { from: admin }))
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

    it("should exit", async () => {
      const min = await ethVault.balanceInStrategy()

      const before = await snapshot()
      await controller.exit(strategyEth.address, min, { from: admin })
      const after = await snapshot()

      // check strategy transferred all underlying token back to vault
      assert(
        eq(
          after.eth.ethVault,
          before.eth.ethVault.add(before.ethVault.balanceInStrategy)
        ),
        "vault"
      )
      // check strategy balance is zero
      assert(eq(after.eth.strategyEth, new BN(0)), "strategy")
    })

    it("should reject if transferred amount < min", async () => {
      const amount = await strategyEth.totalAssets()
      const min = add(amount, 1)

      await chai
        .expect(controller.exit(strategyEth.address, min, { from: admin }))
        .to.be.rejectedWith("withdraw < min")
    })
  })
})
