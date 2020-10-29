import chai from "chai"
import BN from "bn.js"
import {Erc20TokenInstance} from "../../../types/Erc20Token"
import {VaultInstance} from "../../../types/Vault"
import {StrategyTestInstance} from "../../../types/StrategyTest"
import {eq, frac, sub, add, pow} from "../../util"
import _setup from "./setup"

contract("Vault", (accounts) => {
  const MIN_WAIT_TIME = 0

  const refs = _setup(accounts, MIN_WAIT_TIME)
  const {admin, treasury} = refs

  let vault: VaultInstance
  let erc20: Erc20TokenInstance
  let strategy: StrategyTestInstance
  beforeEach(() => {
    vault = refs.vault
    erc20 = refs.erc20
    strategy = refs.strategy
  })

  describe("withdraw", () => {
    const sender = accounts[2]
    const amount = pow(10, 18).mul(new BN(100))
    const min = frac(amount, 99, 100)

    beforeEach(async () => {
      await erc20.mint(sender, amount)
      await erc20.approve(vault.address, amount, {from: sender})
      await vault.deposit(amount, {from: sender})

      await vault.setNextStrategy(strategy.address, {from: admin})
      await vault.setStrategy(strategy.address, new BN(0), {from: admin})
      await vault.setWithdrawFee(100, {from: admin})
    })

    const snapshot = async () => {
      return {
        erc20: {
          sender: await erc20.balanceOf(sender),
          vault: await erc20.balanceOf(vault.address),
          treasury: await erc20.balanceOf(treasury),
          strategy: await erc20.balanceOf(strategy.address),
        },
        vault: {
          balanceOf: {
            sender: await vault.balanceOf(sender),
          },
          balanceInStrategy: await vault.balanceInStrategy(),
          balanceInVault: await vault.balanceInVault(),
          totalSupply: await vault.totalSupply(),
          totalDebt: await vault.totalDebt(),
        },
      }
    }

    it("should withdraw from vault", async () => {
      const shares = await vault.balanceOf(sender)

      const before = await snapshot()
      await vault.withdraw(shares, min, {from: sender})
      const after = await snapshot()

      // check erc20 balance
      assert(sub(after.erc20.sender, before.erc20.sender).gte(min), "erc20 sender")
      assert(sub(before.erc20.vault, after.erc20.vault).gte(min), "erc20 vault")

      // check vault balance
      assert(
        eq(after.vault.balanceOf.sender, sub(before.vault.balanceOf.sender, amount)),
        "vault sender"
      )
      assert(
        eq(after.vault.totalSupply, sub(before.vault.totalSupply, shares)),
        "total supply"
      )
      assert(eq(after.vault.totalDebt, before.vault.totalDebt), "total debt")
    })

    it("should withdraw from strategy", async () => {
      await vault.invest()
      const shares = await vault.balanceOf(sender)
      const sharesToBurn = frac(shares, 1, 2)
      const amountToWithdraw = await vault.getExpectedReturn(sharesToBurn)

      const balInVault = await vault.balanceInVault()
      const balInStrat = await vault.balanceInStrategy()

      // check withdraw from strategy will be executed
      assert(amountToWithdraw.gt(balInVault), "withdraw amount <= vault balance")
      assert(amountToWithdraw.lte(balInStrat), "withdraw amount > vault balance")

      const before = await snapshot()
      await vault.withdraw(sharesToBurn, 0, {from: sender})
      const after = await snapshot()

      assert(
        eq(after.erc20.strategy, before.erc20.strategy.sub(amountToWithdraw)),
        "strategy withdraw"
      )
      // check no tokens where withdrawn from vault
      assert(eq(after.erc20.vault, before.erc20.vault), "vault balance")
      assert(
        eq(after.vault.totalDebt, before.vault.totalDebt.sub(amountToWithdraw)),
        "total debt"
      )
      assert(after.erc20.treasury.gte(before.erc20.treasury), "treasury fee")
    })

    it("should withdraw from vault and strategy", async () => {
      await vault.invest()
      const shares = await vault.balanceOf(sender)
      const amountToWithdraw = await vault.getExpectedReturn(shares)

      const balInVault = await vault.balanceInVault()
      const balInStrat = await vault.balanceInStrategy()

      // check withdraw from vault and strategy will be executed
      assert(amountToWithdraw.gt(balInVault), "withdraw amount <= vault balance")
      assert(amountToWithdraw.gt(balInStrat), "withdraw amount <= vault balance")

      const before = await snapshot()
      await vault.withdraw(shares, 0, {from: sender})
      const after = await snapshot()

      const strategyDiff = before.erc20.strategy.sub(after.erc20.strategy)
      const vaultDiff = before.erc20.vault.sub(after.erc20.vault)

      assert(
        eq(strategyDiff, amountToWithdraw.sub(before.vault.balanceInVault)),
        "strategy withdraw"
      )
      assert(
        eq(vaultDiff, amountToWithdraw.sub(before.vault.balanceInStrategy)),
        "vault withdraw"
      )
      assert(
        eq(after.vault.totalDebt, before.vault.totalDebt.sub(strategyDiff)),
        "total debt"
      )
      assert(after.erc20.treasury.gte(before.erc20.treasury), "treasury fee")
    })

    it("should reject if returned amount < min", async () => {
      const min = add(amount, 1)
      const shares = await vault.balanceOf(sender)

      await chai
        .expect(vault.withdraw(shares, min, {from: sender}))
        .to.be.rejectedWith("withdraw < min")
    })

    it("should reject if balance = 0", async () => {
      const shares = await vault.balanceOf(sender)
      await vault.withdraw(shares, 0, {from: sender})

      await chai.expect(vault.withdraw(shares, 0, {from: sender})).to.be.rejected
    })

    it("should reject if amount = 0", async () => {
      await chai
        .expect(vault.withdraw(0, 0, {from: sender}))
        .to.be.rejectedWith("shares = 0")
    })
  })
})
