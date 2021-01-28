import chai from "chai"
import { ControllerInstance, StrategyERC20TestInstance } from "../../../types"
import _setup from "./setup"

const StrategyERC20Test = artifacts.require("StrategyERC20Test")

contract("Controller", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let controller: ControllerInstance
  let strategy: StrategyERC20TestInstance
  beforeEach(async () => {
    controller = refs.controller
    strategy = await StrategyERC20Test.new(
      refs.controller.address,
      refs.vault.address,
      refs.underlying.address
    )
  })

  describe("revokeStrategy", () => {
    it("should revoke strategy", async () => {
      await controller.approveStrategy(strategy.address, { from: admin })

      const tx = await controller.revokeStrategy(strategy.address, { from: admin })

      assert.equal(await controller.strategies(strategy.address), false, "strategy")

      const log = tx.logs[0]
      assert.equal(log.event, "ApproveStrategy", "log name")
      // @ts-ignore
      assert.equal(log.args.strategy, strategy.address, "log strategy")
      // @ts-ignore
      assert.equal(log.args.approved, false, "log approved")
    })

    it("should reject if not approved", async () => {
      await chai
        .expect(controller.revokeStrategy(strategy.address, { from: admin }))
        .to.be.rejectedWith("!approved strategy")
    })

    it("should reject if caller not admin", async () => {
      await controller.approveStrategy(strategy.address, { from: admin })

      await chai
        .expect(controller.revokeStrategy(strategy.address, { from: accounts[1] }))
        .to.be.rejectedWith("!admin")
    })
  })
})
