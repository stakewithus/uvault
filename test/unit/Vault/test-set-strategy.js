const BN = require("bn.js")
const {expect} = require("../../setup")
const {ZERO_ADDRESS, eq, getBlockTimestamp, timeout, MAX_UINT} = require("../../util")
const setup = require("./setup")
const {assert} = require("chai")

const MockStrategy = artifacts.require("MockStrategy")

contract("Vault", (accounts) => {
  const MIN_WAIT_TIME = 2

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

  describe("setStrategy", () => {
    beforeEach(async () => {
      await vault.setNextStrategy(strategy.address, {from: admin})
    })

    describe("next strategy", () => {
      it("should set new strategy", async () => {
        const tx = await vault.setStrategy(strategy.address, 0, {from: controller})

        // check log
        assert.equal(tx.logs[2].event, "SetStrategy", "event")
        assert.equal(
          tx.logs[2].args.strategy,
          strategy.address,
          "event arg set strategy"
        )
        // check state
        assert.equal(await vault.strategy(), strategy.address, "strategy")
        assert.equal(await vault.nextStrategy(), strategy.address, "next strategy")
        assert.isTrue(await vault.strategies(strategy.address), "approved strategy")
        // check external calls
        assert(eq(await erc20.allowance(vault.address, strategy.address), MAX_UINT))
        assert.isFalse(await strategy._exitWasCalled_(), "exit")
      })

      describe("update", () => {
        let oldStrategy
        let newStrategy
        beforeEach(async () => {
          oldStrategy = strategy
          newStrategy = await MockStrategy.new(
            controller,
            vault.address,
            erc20.address,
            {from: admin}
          )

          await vault.setStrategy(oldStrategy.address, 0, {from: controller})
          await vault.setNextStrategy(newStrategy.address, {from: admin})
        })

        it("should update to next strategy", async () => {
          const snapshot = async () => {
            return {
              erc20: {
                allowance: {
                  oldStrategy: await erc20.allowance(
                    vault.address,
                    oldStrategy.address
                  ),
                  newStrategy: await erc20.allowance(
                    vault.address,
                    newStrategy.address
                  ),
                },
              },
              vault: {
                timeLock: await vault.timeLock(),
                strategy: await vault.strategy(),
              },
            }
          }

          await timeout(MIN_WAIT_TIME)

          const before = await snapshot()
          await vault.setStrategy(newStrategy.address, 0, {from: controller})
          const after = await snapshot()

          // check state
          assert(before.vault.timeLock.gt(new BN(0)), "time lock")
          assert.equal(before.vault.strategy, oldStrategy.address, "old strategy")
          assert.equal(after.vault.strategy, newStrategy.address, "new strategy")
          // check external calls
          assert(
            eq(after.erc20.allowance.newStrategy, MAX_UINT),
            "allowance new strategy"
          )
          assert(
            eq(after.erc20.allowance.oldStrategy, new BN(0)),
            "allowance old strategy"
          )
          assert(await oldStrategy._exitWasCalled_(), "exit")
        })

        it("should reject if exit amount < min", async () => {
          await timeout(MIN_WAIT_TIME)

          await expect(
            vault.setStrategy(newStrategy.address, 1, {from: controller})
          ).to.be.rejectedWith("exit < min")
        })

        it("should reject if timestamp < time lock", async () => {
          await expect(
            vault.setStrategy(newStrategy.address, 0, {from: controller})
          ).to.be.rejectedWith("timestamp < time lock")
        })
      })
    })

    describe("approved strategy", () => {
      let oldStrategy
      let newStrategy
      beforeEach(async () => {
        oldStrategy = strategy
        newStrategy = await MockStrategy.new(controller, vault.address, erc20.address, {
          from: admin,
        })

        await vault.setStrategy(oldStrategy.address, 0, {from: controller})
        await vault.setNextStrategy(newStrategy.address, {from: admin})
        await timeout(MIN_WAIT_TIME)
        await vault.setStrategy(newStrategy.address, 0, {from: controller})
      })

      it("should update strategy", async () => {
        await vault.setStrategy(oldStrategy.address, 0, {from: controller})
        assert.equal(await vault.strategy(), oldStrategy.address, "old strategy")

        await vault.setStrategy(newStrategy.address, 0, {from: controller})
        assert.equal(await vault.strategy(), newStrategy.address, "new strategy")
      })
    })

    it("should reject if not controller", async () => {
      await expect(
        vault.setStrategy(strategy.address, 0, {from: accounts[0]})
      ).to.be.rejectedWith("!controller")
    })

    it("should reject if strategy is zero address", async () => {
      await expect(
        vault.setStrategy(ZERO_ADDRESS, 0, {from: controller})
      ).to.be.rejectedWith("strategy = zero address")
    })

    it("should reject if strategy is equal to current strategy", async () => {
      await vault.setStrategy(strategy.address, 0, {from: controller})

      await expect(
        vault.setStrategy(strategy.address, 0, {from: controller})
      ).to.be.rejectedWith("new strategy = current strategy")
    })

    it("should reject if vault.token != strategy.token", async () => {
      await strategy._setUnderlyingToken_(accounts[0])

      await expect(
        vault.setStrategy(strategy.address, 0, {from: controller})
      ).to.be.rejectedWith("strategy.token != vault.token")
    })

    it("should reject if strategy.vault != vault", async () => {
      await strategy._setVault_(accounts[0])

      await expect(
        vault.setStrategy(strategy.address, 0, {from: controller})
      ).to.be.rejectedWith("strategy.vault != vault")
    })

    it("should reject if not next strategy or approved strategy", async () => {
      const strategy = await MockStrategy.new(
        controller,
        vault.address,
        erc20.address,
        {
          from: admin,
        }
      )

      await expect(
        vault.setStrategy(strategy.address, 0, {from: controller})
      ).to.be.rejectedWith("!approved strategy")
    })
  })
})
