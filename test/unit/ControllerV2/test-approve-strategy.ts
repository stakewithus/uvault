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

  describe("approveStrategy", () => {
    it("should approve strategy", async () => {
      const tx = await controller.approveStrategy(strategy.address, { from: admin })

      assert.equal(await controller.strategies(strategy.address), true, "strategy")

      const log = tx.logs[0]
      assert.equal(log.event, "ApproveStrategy", "log name")
      // @ts-ignore
      assert.equal(log.args.strategy, strategy.address, "log strategy")
      // @ts-ignore
      assert.equal(log.args.approved, true, "log approved")
    })

    it("should reject if already approved", async () => {
      await controller.approveStrategy(strategy.address, { from: admin })

      await chai
        .expect(controller.approveStrategy(strategy.address, { from: admin }))
        .to.be.rejectedWith("already approved strategy")
    })

    it("should reject if caller not admin", async () => {
      await chai
        .expect(controller.approveStrategy(strategy.address, { from: accounts[1] }))
        .to.be.rejectedWith("!admin")
    })
  })
})
