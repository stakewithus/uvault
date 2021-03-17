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

    await split.approveStrategy(strategy.address, { from: timeLock })
  })

  describe("revokeStrategy", () => {
    it("should revoke strategy", async () => {
      const tx = await split.revokeStrategy(strategy.address, { from: admin })

      const strat = await split.strategies(strategy.address)
      // @ts-ignore
      assert.equal(strat.approved, false)

      // check log
      assert.equal(tx.logs[0].event, "RevokeStrategy", "event")
      assert.equal(
        // @ts-ignore
        tx.logs[0].args.strategy,
        strategy.address,
        "log strategy"
      )
    })

    it("should reject if not admin", async () => {
      await chai
        .expect(split.revokeStrategy(strategy.address, { from: accounts[1] }))
        .to.be.rejectedWith("!admin")
    })

    it("should reject if not approved", async () => {
      await split.revokeStrategy(strategy.address, { from: admin })

      await chai
        .expect(split.revokeStrategy(strategy.address, { from: admin }))
        .to.be.rejectedWith("!approved")
    })

    it("should reject if active", async () => {
      await split.activateStrategy(strategy.address, 100, { from: admin })

      await chai
        .expect(split.revokeStrategy(strategy.address, { from: admin }))
        .to.be.rejectedWith("active")
    })
  })
})
