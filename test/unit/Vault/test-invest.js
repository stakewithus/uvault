const BN = require("bn.js")
const {expect} = require("../../setup")
const {ZERO_ADDRESS, eq} = require("../../util")
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

  describe("invest", () => {
    const sender = accounts[1]
    const amount = new BN(10).pow(new BN(18))

    beforeEach(async () => {
      await erc20.mint(sender, amount)
      await erc20.approve(vault.address, amount, {from: sender})
      await vault.deposit(amount, {from: sender})

      await vault.setNextStrategy(strategy.address, {from: admin})
      await vault.setStrategy(strategy.address, 0, {from: controller})
    })

    it("should invest", async () => {
      const snapshot = async () => {
        return {
          vault: {
            availableToInvest: await vault.availableToInvest(),
          },
        }
      }

      const before = await snapshot()
      await vault.invest({from: controller})
      const after = await snapshot()

      assert(
        eq(await strategy._depositAmount_(), before.vault.availableToInvest),
        "deposit"
      )
    })

    it("should not call strategy.deposit if balance = 0", async () => {
      await vault.withdraw(amount, 0, {from: sender})

      assert(eq(await vault.availableToInvest(), new BN(0)), "available")

      await vault.invest({from: controller})

      assert(eq(await strategy._depositAmount_(), new BN(0)), "deposit")
    })

    it("should reject if not controller", async () => {
      await expect(vault.invest({from: accounts[0]})).to.be.rejectedWith("!controller")
    })

    it("should reject if strategy not set", async () => {
      const vault = await Vault.new(controller, erc20.address, MIN_WAIT_TIME)
      assert.equal(await vault.strategy(), ZERO_ADDRESS, "strategy")

      await expect(vault.invest({from: controller})).to.be.rejectedWith(
        "strategy = zero address"
      )
    })
  })
})
