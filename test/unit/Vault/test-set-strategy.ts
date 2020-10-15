import chai from "chai"
import BN from "bn.js"
import {Erc20TokenInstance} from "../../../types/Erc20Token"
import {VaultInstance} from "../../../types/Vault"
import {MockControllerInstance} from "../../../types/MockController"
import {StrategyTestInstance} from "../../../types/StrategyTest"
import {ZERO_ADDRESS, eq, timeout, MAX_UINT} from "../../util"
import _setup from "./setup"

const StrategyTest = artifacts.require("StrategyTest")

contract("Vault", (accounts) => {
  const MIN_WAIT_TIME = 2

  const refs = _setup(accounts, MIN_WAIT_TIME)
  const {admin} = refs

  let controller: MockControllerInstance
  let vault: VaultInstance
  let erc20: Erc20TokenInstance
  let strategy: StrategyTestInstance
  beforeEach(() => {
    controller = refs.controller
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
        const tx = await vault.setStrategy(strategy.address, new BN(0), {
          from: admin,
        })

        // check log
        assert.equal(tx.logs[2].event, "SetStrategy", "event")
        assert.equal(
          // @ts-ignore
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
        let oldStrategy: StrategyTestInstance
        let newStrategy: StrategyTestInstance
        beforeEach(async () => {
          oldStrategy = strategy
          newStrategy = await StrategyTest.new(
            controller.address,
            vault.address,
            erc20.address,
            {from: admin}
          )

          const min = await vault.balanceInStrategy()
          await vault.setStrategy(oldStrategy.address, min, {from: admin})
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
          const min = await vault.balanceInStrategy()
          await vault.setStrategy(newStrategy.address, min, {from: admin})
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
          // simulate token in vault
          await erc20.mint(oldStrategy.address, 123)
          // simulate transfer < balance of strategy
          await oldStrategy._setMaxTransferAmount_(1)

          await timeout(MIN_WAIT_TIME)

          await chai
            .expect(vault.setStrategy(newStrategy.address, new BN(2), {from: admin}))
            .to.be.rejectedWith("exit < min")
        })

        it("should reject if timestamp < time lock", async () => {
          await chai
            .expect(vault.setStrategy(newStrategy.address, new BN(0), {from: admin}))
            .to.be.rejectedWith("timestamp < time lock")
        })
      })
    })

    describe("approved strategy", () => {
      let oldStrategy: StrategyTestInstance
      let newStrategy: StrategyTestInstance
      beforeEach(async () => {
        oldStrategy = strategy
        newStrategy = await StrategyTest.new(
          controller.address,
          vault.address,
          erc20.address,
          {
            from: admin,
          }
        )

        await vault.setStrategy(oldStrategy.address, new BN(0), {from: admin})
        await vault.setNextStrategy(newStrategy.address, {from: admin})
        await timeout(MIN_WAIT_TIME)
        await vault.setStrategy(newStrategy.address, new BN(0), {from: admin})
      })

      it("should update strategy", async () => {
        await vault.setStrategy(oldStrategy.address, new BN(0), {from: admin})
        assert.equal(await vault.strategy(), oldStrategy.address, "old strategy")

        await vault.setStrategy(newStrategy.address, new BN(0), {from: admin})
        assert.equal(await vault.strategy(), newStrategy.address, "new strategy")
      })
    })

    it("should reject if not authorized", async () => {
      await chai
        .expect(vault.setStrategy(strategy.address, new BN(0), {from: accounts[1]}))
        .to.be.rejectedWith("!authorized")
    })

    it("should reject if strategy is zero address", async () => {
      await chai
        .expect(vault.setStrategy(ZERO_ADDRESS, new BN(0), {from: admin}))
        .to.be.rejectedWith("strategy = zero address")
    })

    it("should reject if strategy is equal to current strategy", async () => {
      await vault.setStrategy(strategy.address, new BN(0), {from: admin})

      await chai
        .expect(vault.setStrategy(strategy.address, new BN(0), {from: admin}))
        .to.be.rejectedWith("new strategy = current strategy")
    })

    it("should reject if vault.token != strategy.token", async () => {
      await strategy._setUnderlying_(accounts[0])

      await chai
        .expect(vault.setStrategy(strategy.address, new BN(0), {from: admin}))
        .to.be.rejectedWith("strategy.token != vault.token")
    })

    it("should reject if strategy.vault != vault", async () => {
      await strategy._setVault_(accounts[0])

      await chai
        .expect(vault.setStrategy(strategy.address, new BN(0), {from: admin}))
        .to.be.rejectedWith("strategy.vault != vault")
    })

    it("should reject if not next strategy or approved strategy", async () => {
      const strategy = await StrategyTest.new(
        controller.address,
        vault.address,
        erc20.address,
        {
          from: admin,
        }
      )

      await chai
        .expect(vault.setStrategy(strategy.address, new BN(0), {from: admin}))
        .to.be.rejectedWith("!approved strategy")
    })
  })
})
