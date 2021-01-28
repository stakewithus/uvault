import chai from "chai"
import BN from "bn.js"
import { ETHVaultInstance, StrategyETHTestInstance } from "../../../types"
import { frac, add, pow } from "../../util"
import _setup from "./setup"

contract("ETHVault", (accounts) => {
  const refs = _setup(accounts)
  const { admin, treasury } = refs

  let timeLock: string
  let vault: ETHVaultInstance
  let strategy: StrategyETHTestInstance
  beforeEach(() => {
    timeLock = refs.timeLock
    vault = refs.vault
    strategy = refs.strategy
  })

  describe("withdraw", () => {
    const sender = accounts[2]
    const amount = pow(10, 18)
    const min = frac(amount, 99, 100)

    beforeEach(async () => {
      await vault.deposit({ from: sender, value: amount })

      await vault.approveStrategy(strategy.address, { from: timeLock })
      await vault.setStrategy(strategy.address, new BN(0), { from: admin })
      await vault.setWithdrawFee(100, { from: admin })
    })

    const snapshot = async () => {
      return {
        eth: {
          sender: new BN(await web3.eth.getBalance(sender)),
          treasury: new BN(await web3.eth.getBalance(treasury)),
          vault: new BN(await web3.eth.getBalance(vault.address)),
          strategy: new BN(await web3.eth.getBalance(strategy.address)),
        },
        vault: {
          balanceOf: {
            sender: await vault.balanceOf(sender),
          },
          balanceInStrategy: await vault.balanceInStrategy(),
          balanceInVault: await vault.balanceInVault(),
          totalSupply: await vault.totalSupply(),
          totalAssets: await vault.totalAssets(),
        },
      }
    }

    it("should withdraw from vault", async () => {
      const shares = await vault.balanceOf(sender)

      const before = await snapshot()
      await vault.withdraw(shares, min, { from: sender })
      const after = await snapshot()

      // check eth balance
      assert.equal(after.eth.sender.gte(before.eth.sender.add(min)), true, "eth sender")
      assert.equal(after.eth.vault.lte(before.eth.vault.sub(min)), true, "eth vault")

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
    })

    it("should withdraw from strategy", async () => {
      await vault.invest({ from: admin })
      const shares = await vault.balanceOf(sender)
      const sharesToBurn = frac(shares, 1, 2)
      const amountToWithdraw = await vault.getExpectedReturn(sharesToBurn)
      const min = amountToWithdraw

      const balInETHVault = await vault.balanceInVault()
      const balInStrat = await vault.balanceInStrategy()

      // check withdraw from strategy will be executed
      assert.equal(
        amountToWithdraw.gt(balInETHVault),
        true,
        "withdraw amount <= vault balance"
      )
      assert.equal(
        amountToWithdraw.lte(balInStrat),
        true,
        "withdraw amount > strategy balance"
      )

      const before = await snapshot()
      await vault.withdraw(sharesToBurn, 0, { from: sender })
      const after = await snapshot()

      const fee = after.eth.treasury.sub(before.eth.treasury)
      const txFee = frac(min, 1, 100)

      assert.equal(
        after.eth.sender.gte(before.eth.sender.add(min.sub(fee)).sub(txFee)),
        true,
        "eth sender"
      )
      // check no tokens where withdrawn from vault
      assert.equal(after.eth.vault.gte(before.eth.vault), true, "eth vault")
      // check withdraw fee
      assert.equal(after.eth.treasury.gte(before.eth.treasury), true, "treasury fee")
    })

    it("should withdraw from vault and strategy", async () => {
      await vault.invest()
      const shares = await vault.balanceOf(sender)
      const amountToWithdraw = await vault.getExpectedReturn(shares)
      const min = amountToWithdraw

      const balInETHVault = await vault.balanceInVault()
      const balInStrat = await vault.balanceInStrategy()

      // check withdraw from vault and strategy will be executed
      assert.equal(
        amountToWithdraw.gt(balInETHVault),
        true,
        "withdraw amount <= vault balance"
      )
      assert.equal(
        amountToWithdraw.gt(balInStrat),
        true,
        "withdraw amount <= strategy balance"
      )

      const before = await snapshot()
      await vault.withdraw(shares, 0, { from: sender })
      const after = await snapshot()

      const fee = after.eth.treasury.sub(before.eth.treasury)
      const txFee = frac(min, 1, 100)

      assert.equal(
        after.eth.sender.gte(before.eth.sender.add(min.sub(fee)).sub(txFee)),
        true,
        "eth sender"
      )
      assert.equal(
        after.eth.vault.eq(
          before.eth.vault.sub(amountToWithdraw.sub(before.vault.balanceInStrategy))
        ),
        true,
        "eth vault"
      )
      assert.equal(after.eth.treasury.gte(before.eth.treasury), true, "treasury fee")
    })

    it("should reject if returned amount < min", async () => {
      const min = add(amount, 1)
      const shares = await vault.balanceOf(sender)

      await chai
        .expect(vault.withdraw(shares, min, { from: sender }))
        .to.be.rejectedWith("withdraw < min")
    })

    it("should reject if shares = 0", async () => {
      await chai
        .expect(vault.withdraw(0, 0, { from: sender }))
        .to.be.rejectedWith("shares = 0")
    })
  })
})
