import chai from "chai"
import BN from "bn.js"
import {MockTimeLockInstance} from "../../../types"
import {Erc20TokenInstance} from "../../../types/Erc20Token"
import {VaultInstance} from "../../../types/Vault"
import {StrategyTestInstance} from "../../../types/StrategyTest"
import {eq, frac, sub, add, pow} from "../../util"
import _setup from "./setup"

contract("Vault", (accounts) => {
  const refs = _setup(accounts)
  const {admin, treasury} = refs

  let timeLock: MockTimeLockInstance
  let vault: VaultInstance
  let token: Erc20TokenInstance
  let strategy: StrategyTestInstance
  beforeEach(() => {
    timeLock = refs.timeLock
    vault = refs.vault
    token = refs.token
    strategy = refs.strategy
  })

  describe("withdraw", () => {
    const sender = accounts[2]
    const amount = pow(10, 18).mul(new BN(100))
    const min = frac(amount, 99, 100)

    beforeEach(async () => {
      await token.__mint__(sender, amount)
      await token.approve(vault.address, amount, {from: sender})
      await vault.deposit(amount, {from: sender})

      await timeLock._approveStrategy_(vault.address, strategy.address)
      await vault.setStrategy(strategy.address, new BN(0), {from: admin})
      await vault.setWithdrawFee(100, {from: admin})
    })

    const snapshot = async () => {
      return {
        token: {
          sender: await token.balanceOf(sender),
          vault: await token.balanceOf(vault.address),
          treasury: await token.balanceOf(treasury),
          strategy: await token.balanceOf(strategy.address),
        },
        vault: {
          balanceOf: {
            sender: await vault.balanceOf(sender),
          },
          balanceInStrategy: await vault.balanceInStrategy(),
          balanceInVault: await vault.balanceInVault(),
          totalSupply: await vault.totalSupply(),
          totalDebt: await vault.totalDebt(),
          totalAssets: await vault.totalAssets(),
        },
      }
    }

    it("should withdraw from vault", async () => {
      const shares = await vault.balanceOf(sender)

      const before = await snapshot()
      await vault.withdraw(shares, min, {from: sender})
      const after = await snapshot()

      // check token balance
      assert.equal(
        after.token.sender.gte(before.token.sender.add(min)),
        true,
        "token sender"
      )
      assert.equal(
        after.token.vault.lte(before.token.vault.sub(min)),
        true,
        "token vault"
      )

      // check vault balance
      assert.equal(
        after.vault.balanceOf.sender.eq(before.vault.balanceOf.sender.sub(shares)),
        true,
        "vault sender"
      )
      assert.equal(
        after.vault.totalSupply.eq(before.vault.totalSupply.sub(shares)),
        true,
        "total supply"
      )
      assert.equal(after.vault.totalDebt.eq(before.vault.totalDebt), true, "total debt")
    })

    it("should withdraw from strategy", async () => {
      await vault.invest({from: admin})
      const shares = await vault.balanceOf(sender)
      const sharesToBurn = frac(shares, 1, 2)
      const amountToWithdraw = await vault.getExpectedReturn(sharesToBurn)

      const balInVault = await vault.balanceInVault()
      const balInStrat = await vault.balanceInStrategy()

      // check withdraw from strategy will be executed
      assert.equal(
        amountToWithdraw.gt(balInVault),
        true,
        "withdraw amount <= vault balance"
      )
      assert.equal(
        amountToWithdraw.lte(balInStrat),
        true,
        "withdraw amount > vault balance"
      )

      const before = await snapshot()
      await vault.withdraw(sharesToBurn, 0, {from: sender})
      const after = await snapshot()

      assert.equal(
        after.token.strategy.eq(before.token.strategy.sub(amountToWithdraw)),
        true,
        "strategy withdraw"
      )
      // check no tokens where withdrawn from vault
      assert.equal(after.token.vault.eq(before.token.vault), true, "vault balance")
      assert.equal(
        after.vault.totalDebt.eq(before.vault.totalDebt.sub(amountToWithdraw)),
        true,
        "total debt"
      )
      assert.equal(
        after.token.treasury.gte(before.token.treasury),
        true,
        "treasury fee"
      )
    })

    it("should withdraw from vault and strategy", async () => {
      await vault.invest()
      const shares = await vault.balanceOf(sender)
      const amountToWithdraw = await vault.getExpectedReturn(shares)

      const balInVault = await vault.balanceInVault()
      const balInStrat = await vault.balanceInStrategy()

      // check withdraw from vault and strategy will be executed
      assert.equal(
        amountToWithdraw.gt(balInVault),
        true,
        "withdraw amount <= vault balance"
      )
      assert.equal(
        amountToWithdraw.gt(balInStrat),
        true,
        "withdraw amount <= vault balance"
      )

      const before = await snapshot()
      await vault.withdraw(shares, 0, {from: sender})
      const after = await snapshot()

      const strategyDiff = before.token.strategy.sub(after.token.strategy)
      const vaultDiff = before.token.vault.sub(after.token.vault)

      assert.equal(
        strategyDiff.eq(amountToWithdraw.sub(before.vault.balanceInVault)),
        true,
        "strategy withdraw"
      )
      assert.equal(
        vaultDiff.eq(amountToWithdraw.sub(before.vault.balanceInStrategy)),
        true,
        "vault withdraw"
      )
      assert.equal(
        after.vault.totalDebt.eq(before.vault.totalDebt.sub(strategyDiff)),
        true,
        "total debt"
      )
      assert.equal(
        after.token.treasury.gte(before.token.treasury),
        true,
        "treasury fee"
      )
    })

    it("should reject if returned amount < min", async () => {
      const min = add(amount, 1)
      const shares = await vault.balanceOf(sender)

      await chai
        .expect(vault.withdraw(shares, min, {from: sender}))
        .to.be.rejectedWith("withdraw < min")
    })

    it("should reject if shares = 0", async () => {
      await chai
        .expect(vault.withdraw(0, 0, {from: sender}))
        .to.be.rejectedWith("shares = 0")
    })
  })
})
