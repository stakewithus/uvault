import chai from "chai"
import { StrategyERC20SplitInstance, StrategyERC20V3TestInstance } from "../../../types"
import { eq, add, sub } from "../../util"
import _setup from "./setup"

const StrategyERC20_V3_Test = artifacts.require("StrategyERC20_V3_Test")

contract("StrategyERC20Split", (accounts) => {
  const refs = _setup(accounts)
  const { admin, timeLock, keeper } = refs

  let split: StrategyERC20SplitInstance
  let strategies: StrategyERC20V3TestInstance[]
  let strategy: StrategyERC20V3TestInstance
  beforeEach(async () => {
    split = refs.split
    strategies = refs.strategies
    strategy = await StrategyERC20_V3_Test.new(
      refs.controller.address,
      refs.split.address,
      refs.underlying.address,
      keeper,
      { from: admin }
    )

    await split.approveStrategy(strategy.address, { from: timeLock })
    await split.activateStrategy(strategy.address, 100, { from: admin })
  })

  const snapshot = async () => {
    return {
      split: {
        activeStrategiesCount: await split.getActiveStrategiesCount(),
        totalDepositRatio: await split.totalDepositRatio(),
      },
    }
  }

  describe("deactivateStrategy", () => {
    it("should deactivate strategy", async () => {
      const before = await snapshot()
      await split.deactivateStrategy(strategy.address, 0, { from: admin })
      const after = await snapshot()

      const strat = await split.strategies(strategy.address)
      const len = after.split.activeStrategiesCount.toNumber()

      // @ts-ignore
      assert.equal(strat.active, false)
      // @ts-ignore
      assert(eq(strat.depositRatio, 0), "deposit ratio")

      // check deactivated strategy not in active strategies
      for (let i = 0; i < len; i++) {
        assert.notEqual(
          await split.activeStrategies(i),
          strategy.address,
          "active strategy"
        )
      }

      // check order is preserved
      for (let i = 0; i < len; i++) {
        assert.equal(
          await split.activeStrategies(i),
          strategies[i].address,
          "active strategy order"
        )
      }

      assert(
        eq(
          after.split.activeStrategiesCount,
          sub(before.split.activeStrategiesCount, 1)
        ),
        "count"
      )
      assert(
        eq(after.split.totalDepositRatio, sub(before.split.totalDepositRatio, 100)),
        "total deposit ratio"
      )
    })

    it("should reject if not admin", async () => {
      await chai
        .expect(split.deactivateStrategy(strategy.address, 0, { from: accounts[1] }))
        .to.be.rejectedWith("!admin")
    })

    it("should reject if not active", async () => {
      const strategy = await StrategyERC20_V3_Test.new(
        refs.controller.address,
        refs.split.address,
        refs.underlying.address,
        keeper,
        { from: admin }
      )

      await chai
        .expect(split.deactivateStrategy(strategy.address, 0, { from: admin }))
        .to.be.rejectedWith("!active")
    })

    it("should reject if exit < 0", async () => {
      await chai
        .expect(split.deactivateStrategy(strategy.address, 1, { from: admin }))
        .to.be.rejectedWith("exit < min")
    })
  })
})
