const BN = require("bn.js")
const {expect} = require("../../setup")
const {ZERO_ADDRESS, eq, getBlockTimestamp} = require("../../util")
const setup = require("./setup")

const MockStrategy = artifacts.require("MockStrategy")

contract("Vault", (accounts) => {
  const MIN_WAIT_TIME = 100

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

  describe("setNextStrategy", () => {
    it("should set next strategy when current strategy is not set", async () => {
      const tx = await vault.setNextStrategy(strategy.address, {from: admin})

      assert.equal(tx.logs[0].event, "SetNextStrategy", "event")
      assert.equal(
        tx.logs[0].args.strategy,
        strategy.address,
        "event arg next strategy"
      )
      assert.equal(await vault.nextStrategy(), strategy.address)
      assert(eq(await vault.timeLock(), new BN(0)), "time lock")
    })

    it("should set next strategy when current strategy is set", async () => {
      await vault.setNextStrategy(strategy.address, {from: admin})
      await vault.setStrategy(strategy.address, 0, {from: admin})

      assert.equal(await vault.strategy(), strategy.address, "strategy")

      const newStrategy = await MockStrategy.new(
        controller.address,
        vault.address,
        erc20.address,
        {from: admin}
      )
      const tx = await vault.setNextStrategy(newStrategy.address, {
        from: admin,
      })

      const timestamp = await getBlockTimestamp(web3, tx)

      assert.equal(await vault.nextStrategy(), newStrategy.address, "next strategy")
      assert(eq(await vault.timeLock(), new BN(timestamp + MIN_WAIT_TIME)), "time lock")
    })

    it("should reject if not admin", async () => {
      await expect(
        vault.setNextStrategy(strategy.address, {from: accounts[1]})
      ).to.be.rejectedWith("!admin")
    })

    it("should reject zero address", async () => {
      await expect(
        vault.setNextStrategy(ZERO_ADDRESS, {from: accounts[1]})
      ).to.be.rejectedWith("!admin")
    })

    it("should reject same strategy", async () => {
      await vault.setNextStrategy(strategy.address, {from: admin})

      await expect(
        vault.setNextStrategy(strategy.address, {from: admin})
      ).to.be.rejectedWith("same next strategy")
    })
  })
})
