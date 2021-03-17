import chai from "chai"
import { StrategyERC20SplitInstance, StrategyERC20TestInstance } from "../../../types"
import { eq, add, sub } from "../../util"
import _setup from "./setup"

const StrategyERC20Test = artifacts.require("StrategyERC20Test")

contract("StrategyERC20Split", (accounts) => {
  const refs = _setup(accounts)
  const { admin, timeLock } = refs

  let split: StrategyERC20SplitInstance
  let strategy: StrategyERC20TestInstance
  beforeEach(async () => {
    split = refs.split
    strategy = await StrategyERC20Test.new(
      refs.controller.address,
      refs.split.address,
      refs.underlying.address,
      { from: admin }
    )

    await split.approveStrategy(strategy.address, { from: timeLock })
  })

  const snapshot = async () => {
    return {
      split: {
        activeStrategiesCount: await split.getActiveStrategiesCount(),
        totalDepositRatio: await split.totalDepositRatio(),
      },
    }
  }

  describe("activateStrategy", () => {
    it("should activate strategy", async () => {
      const depositRatio = 100

      const before = await snapshot()
      await split.activateStrategy(strategy.address, depositRatio, { from: admin })
      const after = await snapshot()

      const strat = await split.strategies(strategy.address)
      const lastIndex = sub(after.split.activeStrategiesCount, 1)

      // @ts-ignore
      assert.equal(strat.active, true)
      // @ts-ignore
      assert.equal(strat.depositRatio, depositRatio)
      assert(
        eq(
          after.split.totalDepositRatio,
          add(before.split.totalDepositRatio, depositRatio)
        ),
        "total deposit ratio"
      )
      assert.equal(await split.activeStrategies(lastIndex), strategy.address)
      assert(
        eq(
          after.split.activeStrategiesCount,
          add(before.split.activeStrategiesCount, 1)
        ),
        "count"
      )
    })

    it("should reject if not admin", async () => {
      await chai
        .expect(split.activateStrategy(strategy.address, 100, { from: accounts[1] }))
        .to.be.rejectedWith("!admin")
    })

    it("should reject if not approved", async () => {
      const strategy = await StrategyERC20Test.new(
        refs.controller.address,
        refs.split.address,
        refs.underlying.address,
        { from: admin }
      )

      await chai
        .expect(split.activateStrategy(strategy.address, 100, { from: admin }))
        .to.be.rejectedWith("!approved")
    })

    it("should reject if active", async () => {
      await split.activateStrategy(strategy.address, 100, { from: admin })

      await chai
        .expect(split.activateStrategy(strategy.address, 100, { from: admin }))
        .to.be.rejectedWith("active")
    })

    it("should reject if deposit ratio = 0", async () => {
      await chai
        .expect(split.activateStrategy(strategy.address, 0, { from: admin }))
        .to.be.rejectedWith("deposit ratio = 0")
    })

    it("should reject if total deposit ratio > max", async () => {
      await chai
        .expect(split.activateStrategy(strategy.address, 10000, { from: admin }))
        .to.be.rejectedWith("total deposit ratio > max")
    })

    it("should reject if active > max", async () => {
      // max = 10 - 3 (active) = 7
      for (let i = 0; i < 7; i++) {
        const strategy = await StrategyERC20Test.new(
          refs.controller.address,
          refs.split.address,
          refs.underlying.address,
          { from: admin }
        )

        await split.approveStrategy(strategy.address, { from: timeLock })
        await split.activateStrategy(strategy.address, 1, { from: admin })
      }

      const strategy = await StrategyERC20Test.new(
        refs.controller.address,
        refs.split.address,
        refs.underlying.address,
        { from: admin }
      )
      await split.approveStrategy(strategy.address, { from: timeLock })

      await chai
        .expect(split.activateStrategy(strategy.address, 100, { from: admin }))
        .to.be.rejectedWith("active > max")
    })
  })
})
