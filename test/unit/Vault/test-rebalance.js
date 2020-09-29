const BN = require("bn.js")
const {expect} = require("../../setup")
const {ZERO_ADDRESS, eq, add, MAX_UINT} = require("../../util")
const setup = require("./setup")

const Vault = artifacts.require("Vault")

contract("Vault", (accounts) => {
  const MIN_WAIT_TIME = 0

  const refs = setup(accounts, MIN_WAIT_TIME)
  const {admin, controller} = refs

  let vault
  let erc20
  let strategy
  beforeEach(() => {
    vault = refs.vault
    erc20 = refs.erc20
    strategy = refs.strategy
  })

  describe("rebalance", () => {
    const sender = accounts[1]
    const amount = new BN(10).pow(new BN(18))

    beforeEach(async () => {
      await erc20.mint(sender, amount)
      await erc20.approve(vault.address, amount, {from: sender})
      await vault.deposit(amount, {from: sender})

      await vault.setNextStrategy(strategy.address, {from: admin})
      await vault.setStrategy(strategy.address, {from: controller})
    })

    it("should rebalance", async () => {
      const snapshot = async () => {
        return {
          vault: {
            availableToInvest: await vault.availableToInvest(),
          },
          strategy: {
            underlyingBalance: await strategy.underlyingBalance(),
          },
        }
      }

      const before = await snapshot()
      await vault.rebalance({from: controller})
      const after = await snapshot()

      assert(eq(await strategy._withdrawAmount_(), MAX_UINT), "withdraw")

      assert(
        eq(
          await strategy._depositAmount_(),
          add(before.vault.availableToInvest, before.strategy.underlyingBalance)
        ),
        "deposit"
      )
    })

    it("should reject if not controller", async () => {
      await expect(vault.rebalance({from: accounts[0]})).to.be.rejectedWith(
        "!controller"
      )
    })

    it("should reject if strategy not set", async () => {
      const vault = await Vault.new(controller, erc20.address, MIN_WAIT_TIME)
      assert.equal(await vault.strategy(), ZERO_ADDRESS, "strategy")

      await expect(vault.rebalance({from: controller})).to.be.rejectedWith(
        "strategy = zero address"
      )
    })
  })
})
