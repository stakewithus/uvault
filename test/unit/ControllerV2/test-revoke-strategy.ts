import chai from "chai"
import { ControllerV2Instance, StrategyTestV2Instance } from "../../../types"
import _setup from "./setup"

const StrategyTestV2 = artifacts.require("StrategyTestV2")

contract("Controller", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let controller: ControllerV2Instance
  let strategy: StrategyTestV2Instance
  beforeEach(async () => {
    controller = refs.controller
    strategy = await StrategyTestV2.new(
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
