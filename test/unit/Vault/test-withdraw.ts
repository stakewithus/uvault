import chai from "chai"
import BN from "bn.js"
import {Erc20TokenInstance} from "../../../types/Erc20Token"
import {VaultInstance} from "../../../types/Vault"
import { StrategyTestInstance } from "../../../types/StrategyTest"
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
    const amount = pow(10, 18).mul(new BN(10))
    const min = frac(amount, 99, 100)

    beforeEach(async () => {
      await erc20.mint(sender, amount)
      await erc20.approve(vault.address, amount, {from: sender})
      await vault.deposit(amount, {from: sender})

      await vault.setNextStrategy(strategy.address, {from: admin})
      await vault.setStrategy(strategy.address, {from: admin})
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
          balanceInVault: await vault.balanceInVault(),
          totalSupply: await vault.totalSupply(),
        },
      }
    }

    it("should withdraw from vault", async () => {
      const before = await snapshot()
      await vault.withdraw(amount, min, {from: sender})
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
        eq(after.vault.totalSupply, sub(before.vault.totalSupply, amount)),
        "total supply"
      )
    })

    it("should withdraw from strategy", async () => {
      // set balance in strategy, this would increate vault.totalAssets()
      const balInStrategy = pow(10, 18).mul(new BN(40))
      await erc20.mint(strategy.address, balInStrategy)
      // vault bal = 10
      // strategy bal = 40
      // shares to burn = shares * (bal in strategy / (bal in vault + strategy))
      const shares = amount.mul(new BN(40)).div(new BN(50))
      const amountToWithdraw = await vault.calcWithdraw(shares)

      assert(eq(amountToWithdraw, balInStrategy), "withdraw amount")

      const before = await snapshot()
      await vault.withdraw(shares, 0, {from: sender})
      const after = await snapshot()

      assert(
        eq(before.erc20.strategy.sub(after.erc20.strategy), amountToWithdraw),
        "strategy withdraw"
      )
      // check no tokens where withdrawn from vault
      assert(eq(after.erc20.vault, before.erc20.vault), "vault balance")
    })

    it("should withdraw from vault and strategy", async () => {
      // set balance in strategy, this would increate vault.totalAssets()
      const balInStrategy = pow(10, 18).mul(new BN(10))
      await erc20.mint(strategy.address, balInStrategy)
      // vault bal = 10
      // strategy bal = 10
      // shares to burn = shares * (bal in strategy / (bal in vault + strategy))
      const amountToWithdraw = await vault.calcWithdraw(amount)

      const before = await snapshot()
      await vault.withdraw(amount, 0, {from: sender})
      const after = await snapshot()

      assert(
        eq(
          before.erc20.strategy.sub(after.erc20.strategy),
          sub(amountToWithdraw, before.vault.balanceInVault)
        ),
        "strategy withdraw"
      )
      assert(after.erc20.treasury.gt(before.erc20.treasury), "treasury fee")
    })

    it("should reject if returned amount < min", async () => {
      const min = add(amount, 1)

      await chai.expect(vault.withdraw(amount, min, {from: sender})).to.be.rejectedWith(
        "withdraw < min"
      )
    })

    it("should reject if balance = 0", async () => {
      const bal = await vault.balanceOf(sender)
      await vault.withdraw(bal, 0, {from: sender})

      await chai.expect(vault.withdraw(bal, 0, {from: sender})).to.be.rejected
    })

    it("should reject if amount = 0", async () => {
      await chai.expect(vault.withdraw(0, 0, {from: sender})).to.be.rejectedWith(
        "shares = 0"
      )
    })
  })
})
