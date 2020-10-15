import chai from "chai"
import {ControllerInstance} from "../../../types/Controller"
import {StrategyTestInstance} from "../../../types/StrategyTest"
import {add} from "../../util"
import _setup from "./setup"

contract("Controller", (accounts) => {
  const refs = _setup(accounts)
  const {admin, gasRelayer} = refs

  let controller: ControllerInstance
  let strategy: StrategyTestInstance
  beforeEach(() => {
    controller = refs.controller
    strategy = refs.strategy
  })

  describe("exit", () => {
    it("should exit admin", async () => {
      await controller.exit(strategy.address, 0, {from: admin})

      assert(await strategy._exitWasCalled_(), "exit")
    })

    it("should reject if withdraw < min", async () => {
      const bal = await strategy.totalAssets()
      const min = add(bal, 1)

      await chai
        .expect(controller.exit(strategy.address, min, {from: admin}))
        .to.be.rejectedWith("withdraw < min")
    })

    it("should reject if caller not authorized", async () => {
      await chai
        .expect(controller.exit(strategy.address, 0, {from: accounts[1]}))
        .to.be.rejectedWith("!authorized")
    })

    it("should reject invalid strategy address", async () => {
      await chai.expect(controller.exit(accounts[1], 0, {from: admin})).to.be.rejected
    })
  })
})
