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

  describe("invest", () => {
    const sender = accounts[1]
    const amount = new BN(10).pow(new BN(18))

    beforeEach(async () => {
      await erc20.mint(sender, amount)
      await erc20.approve(vault.address, amount, {from: sender})
      await vault.deposit(amount, {from: sender})

      await vault.setNextStrategy(strategy.address, {from: admin})
      await vault.setStrategy(strategy.address, 0, {from: admin})

      await vault.setInvestFee(new BN(100))
    })

    it("should invest", async () => {
      const snapshot = async () => {
        return {
          vault: {
            availableToInvest: await vault.availableToInvest(),
          },
          erc20: {
            admin: await erc20.balanceOf(admin),
          },
        }
      }

      const fee = frac(await vault.availableToInvest(), new BN(100), new BN(10000))

      const before = await snapshot()
      await vault.invest({from: admin})
      const after = await snapshot()

      assert(
        eq(await strategy._depositAmount_(), before.vault.availableToInvest.sub(fee)),
        "deposit"
      )
      // check fee was transferred
      assert(eq(after.erc20.admin, before.erc20.admin.add(fee)), "fee")
    })

    it("should reject if paused", async () => {
      await vault.pause({from: admin})
      await expect(vault.invest({from: sender})).to.be.rejectedWith("paused")
    })

    it("should reject if available = 0", async () => {
      await vault.withdraw(amount, 0, {from: sender})

      assert(eq(await vault.availableToInvest(), new BN(0)), "available")

      await expect(vault.invest({from: admin})).to.be.rejectedWith("available = 0")
    })

    it("should reject if strategy not set", async () => {
      const vault = await Vault.new(controller.address, erc20.address, MIN_WAIT_TIME)
      assert.equal(await vault.strategy(), ZERO_ADDRESS, "strategy")

      await expect(vault.invest({from: admin})).to.be.rejectedWith(
        "strategy = zero address"
      )
    })
  })
})
