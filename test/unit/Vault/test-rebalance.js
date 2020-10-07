const BN = require("bn.js")
const {assert} = require("chai")
const {expect} = require("../../setup")
const {ZERO_ADDRESS, eq, frac} = require("../../util")
const setup = require("./setup")

const Vault = artifacts.require("Vault")

contract("Vault", (accounts) => {
  const MIN_WAIT_TIME = 0

  const refs = setup(accounts, MIN_WAIT_TIME)
  const {admin} = refs

  let controller
  let vault
  let erc20
  let strategy
  beforeEach(() => {
    controller = refs.controller
    vault = refs.vault
    erc20 = refs.erc20
    strategy = refs.strategy
  })

  const user = accounts[1]
  const REBALANCE_FEE = new BN(100)

  describe("rebalance", () => {
    beforeEach(async () => {
      // mint 100 tokens
      const amount = new BN(10).pow(new BN(18)).mul(new BN(100))

      await erc20.mint(user, amount)
      await erc20.approve(vault.address, amount, {from: user})
      await vault.deposit(amount, {from: user})

      await vault.setNextStrategy(strategy.address, {from: admin})
      await vault.setStrategy(strategy.address, 0, {from: admin})

      await vault.setRebalanceFee(REBALANCE_FEE, {from: admin})

      await vault.rebalance()
    })

    const snapshot = async () => {
      return {
        vault: {
          minReserve: await vault.minReserve(),
        },
        erc20: {
          user: await erc20.balanceOf(user),
          vault: await erc20.balanceOf(vault.address),
          strategy: await erc20.balanceOf(strategy.address),
        },
      }
    }

    it("should reject if strategy not set", async () => {
      const vault = await Vault.new(controller.address, erc20.address, MIN_WAIT_TIME)
      assert.equal(await vault.strategy(), ZERO_ADDRESS, "strategy")

      await expect(vault.rebalance()).to.be.rejectedWith("strategy = zero address")
    })

    it("should reject if paused", async () => {
      await vault.pause({from: admin})
      await expect(vault.rebalance()).to.be.rejectedWith("paused")
    })

    it("should not rebalance if (vault / reserve) ratio > 95 and < 105", async () => {
      await vault.rebalance({from: user})

      const before = await snapshot()
      await vault.rebalance({from: user})
      const after = await snapshot()

      assert(eq(after.erc20.vault, before.erc20.vault), "vault")
      assert(eq(after.erc20.strategy, before.erc20.strategy), "strategy")
    })

    describe("withdraw", () => {
      beforeEach(async () => {
        // setup balance in vault to be < min reserve
        const amount = new BN(10).pow(new BN(18))
        await vault.withdraw(amount, 0, {from: user})
      })

      it("should withdraw if balance in vault < min reserve", async () => {
        const before = await snapshot()
        await vault.rebalance({from: user})
        const after = await snapshot()

        // check withdraw amount > 0
        const withdrawAmount = before.vault.minReserve.sub(before.erc20.vault)
        assert(withdrawAmount.gt(new BN(0)), "withdraw amount")
        // check withdraw from strategy
        assert(
          eq(after.erc20.strategy, before.erc20.strategy.sub(withdrawAmount)),
          "strategy"
        )
        // check transfer to vault
        const fee = frac(withdrawAmount, REBALANCE_FEE, new BN(10000))
        assert(
          eq(after.erc20.vault, before.erc20.vault.add(withdrawAmount.sub(fee))),
          "vault"
        )
        // check tranfser to caller
        assert(eq(after.erc20.user, before.erc20.user.add(fee)), "fee")
      })

      it("should reject withdraw if withdraw < min", async () => {
        // simulate failing transfer
        await strategy._setShouldTransfer_(false)

        await expect(vault.rebalance()).to.be.rejectedWith("withdraw < min")
      })
    })

    describe("deposit", () => {
      beforeEach(async () => {
        // setup balance in vault to be > min reserve
        const amount = new BN(10).pow(new BN(18))
        await erc20.mint(user, amount)
        await erc20.approve(vault.address, amount, {from: user})
        await vault.deposit(amount, {from: user})
      })

      it("should deposit if balance in vault > min reserve", async () => {
        const before = await snapshot()
        await vault.rebalance({from: user})
        const after = await snapshot()

        // check deposit amount > 0
        const reserveDiff = before.erc20.vault.sub(before.vault.minReserve)
        const fee = frac(reserveDiff, REBALANCE_FEE, new BN(10000))
        const depositAmount = reserveDiff.sub(fee)
        assert(depositAmount.gt(new BN(0)), "deposit amount")

        // check deposit to strategy
        assert(
          eq(after.erc20.strategy, before.erc20.strategy.add(depositAmount)),
          "strategy"
        )
        // check transfer from vault
        assert(eq(after.erc20.vault, before.erc20.vault.sub(reserveDiff)), "vault")
        // check tranfser to caller
        assert(eq(after.erc20.user, before.erc20.user.add(fee)), "fee")
      })
    })
  })
})
