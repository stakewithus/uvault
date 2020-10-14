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

  describe("withdrawAll", () => {
    it("should withdrawAll admin", async () => {
      await controller.withdrawAll(strategy.address, 0, {from: admin})

      assert(await strategy._withdrawAllWasCalled_(), "withdraw")
    })

    it("should withdrawAll gas relayer", async () => {
      await controller.withdrawAll(strategy.address, 0, {from: gasRelayer})

      assert(await strategy._withdrawAllWasCalled_(), "withdraw")
    })

    it("should reject if withdraw < min", async () => {
      const bal = await strategy.totalAssets()
      const min = add(bal, 1)

      await chai.expect(
        controller.withdrawAll(strategy.address, min, {from: admin})
      ).to.be.rejectedWith("withdraw < min")
    })

    it("should reject if caller not authorized", async () => {
      await chai.expect(
        controller.withdrawAll(strategy.address, 0, {from: accounts[1]})
      ).to.be.rejectedWith("!authorized")
    })

    it("should reject invalid strategy address", async () => {
      await chai.expect(controller.withdrawAll(accounts[1], 0, {from: admin})).to.be.rejected
    })
  })
})
