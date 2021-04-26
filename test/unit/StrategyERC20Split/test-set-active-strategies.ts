import chai from "chai"
import { StrategyERC20SplitInstance, StrategyERC20V3TestInstance } from "../../../types"
import _setup from "./setup"

const StrategyERC20_V3_Test = artifacts.require("StrategyERC20_V3_Test")

contract("StrategyERC20Split", (accounts) => {
  const refs = _setup(accounts)
  const { keeper } = refs

  let split: StrategyERC20SplitInstance
  let strategies: StrategyERC20V3TestInstance[]
  beforeEach(async () => {
    split = refs.split
    strategies = refs.strategies
  })

  describe("setActiveStrategies", () => {
    it("should set active strategies", async () => {
      const strats = strategies.map((strat) => strat.address)
      // swap order
      const tmp = strats[0]
      strats[0] = strats[1]
      strats[1] = tmp

      await split.setActiveStrategies(strats, { from: keeper })

      for (let i = 0; i < strats.length; i++) {
        assert.equal(await split.activeStrategies(i), strats[i], `strat ${i}`)
      }
    })

    it("should reject if not keeper", async () => {
      await chai
        .expect(split.setActiveStrategies([], { from: accounts[1] }))
        .to.be.rejectedWith("!keeper")
    })

    it("should reject if length not equal", async () => {
      await chai
        .expect(split.setActiveStrategies([], { from: keeper }))
        .to.be.rejectedWith("!strategies.length")
    })

    it("should reject if not active", async () => {
      const strategy = await StrategyERC20_V3_Test.new(
        refs.controller.address,
        refs.split.address,
        refs.underlying.address,
        keeper,
        { from: keeper }
      )

      const strats = strategies.map((strat) => strat.address)
      strats[0] = strategy.address

      await chai
        .expect(split.setActiveStrategies(strats, { from: keeper }))
        .to.be.rejectedWith("!active")
    })

    it("should reject if duplicate", async () => {
      const strats = strategies.map((strat) => strat.address)
      strats[0] = strats[1]

      await chai
        .expect(split.setActiveStrategies(strats, { from: keeper }))
        .to.be.rejectedWith("!active")
    })
  })
})
