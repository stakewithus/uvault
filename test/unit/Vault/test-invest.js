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
    const user = accounts[1]
    const amount = new BN(10).pow(new BN(18))

    beforeEach(async () => {
      await erc20.mint(user, amount)
      await erc20.approve(vault.address, amount, {from: user})
      await vault.deposit(amount, {from: user})

      await vault.setNextStrategy(strategy.address, {from: admin})
      await vault.setStrategy(strategy.address, 0, {from: admin})
    })

    it("should invest", async () => {
      const snapshot = async () => {
        return {
          vault: {
            availableToInvest: await vault.availableToInvest(),
          },
          erc20: {
            admin: await erc20.balanceOf(admin),
            strategy: await erc20.balanceOf(strategy.address),
          },
        }
      }

      const before = await snapshot()
      await vault.invest({from: admin})
      const after = await snapshot()

      // check token transfer to strategy
      assert(eq(after.erc20.strategy, before.vault.availableToInvest), "deposit")
    })

    it("should reject if available = 0", async () => {
      await vault.invest({from: admin})
      await expect(vault.invest({from: admin})).to.be.rejectedWith("available = 0")
    })

    it("should reject if not authorized", async () => {
      await expect(vault.invest({from: user})).to.be.rejectedWith("!authorized")
    })

    it("should reject if paused", async () => {
      await vault.pause({from: admin})
      await expect(vault.invest({from: admin})).to.be.rejectedWith("paused")
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
