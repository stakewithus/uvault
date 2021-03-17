import chai from "chai"
import { StrategyERC20SplitInstance, StrategyERC20TestInstance } from "../../../types"
import _setup from "./setup"

const TestToken = artifacts.require("TestToken")
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
  })

  describe("approveStrategy", () => {
    it("should approve strategy", async () => {
      const tx = await split.approveStrategy(strategy.address, { from: timeLock })

      const strat = await split.strategies(strategy.address)
      // @ts-ignore
      assert.equal(strat.approved, true)

      // check log
      assert.equal(tx.logs[0].event, "ApproveStrategy", "event")
      assert.equal(
        // @ts-ignore
        tx.logs[0].args.strategy,
        strategy.address,
        "log strategy"
      )
    })

    it("should reject if not time lock", async () => {
      await chai
        .expect(split.approveStrategy(strategy.address, { from: accounts[1] }))
        .to.be.rejectedWith("!timeLock")
    })

    it("should reject if approved", async () => {
      await split.approveStrategy(strategy.address, { from: timeLock })

      await chai
        .expect(split.approveStrategy(strategy.address, { from: timeLock }))
        .to.be.rejectedWith("approved")
    })

    it("should reject if vault != split", async () => {
      const vault = accounts[1]
      const strategy = await StrategyERC20Test.new(
        refs.controller.address,
        vault,
        refs.underlying.address,
        { from: admin }
      )

      await chai
        .expect(split.approveStrategy(strategy.address, { from: timeLock }))
        .to.be.rejectedWith("!strategy.vault")
    })

    it("should reject if underlying != split.underlying", async () => {
      const underlying = await TestToken.new()
      const strategy = await StrategyERC20Test.new(
        refs.controller.address,
        refs.split.address,
        underlying.address,
        { from: admin }
      )
      await chai
        .expect(split.approveStrategy(strategy.address, { from: timeLock }))
        .to.be.rejectedWith("!strategy.underlying")
    })
  })
})
