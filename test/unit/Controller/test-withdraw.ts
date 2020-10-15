import BN from "bn.js"
import chai from "chai"
import {ControllerInstance} from "../../../types/Controller"
import {StrategyTestInstance} from "../../../types/StrategyTest"
import {eq, add} from "../../util"
import _setup from "./setup"

contract("Controller", (accounts) => {
  const refs = _setup(accounts)
  const {admin} = refs

  let controller: ControllerInstance
  let strategy: StrategyTestInstance
  beforeEach(() => {
    controller = refs.controller
    strategy = refs.strategy
  })

  const amount = new BN(1)
  const min = new BN(0)

  describe("withdraw", () => {
    it("should withdraw admin", async () => {
      await controller.withdraw(strategy.address, amount, min, {from: admin})

      assert(eq(await strategy._withdrawAmount_(), amount), "withdraw")
    })

    it("should reject if withdraw < min", async () => {
      const min = add(amount, 1)
      await chai
        .expect(controller.withdraw(strategy.address, amount, min, {from: admin}))
        .to.be.rejectedWith("withdraw < min")
    })

    it("should reject if caller not authorized", async () => {
      await chai
        .expect(controller.withdraw(strategy.address, amount, min, {from: accounts[1]}))
        .to.be.rejectedWith("!authorized")
    })

    it("should reject invalid strategy address", async () => {
      await chai.expect(controller.withdraw(accounts[1], amount, min, {from: admin})).to
        .be.rejected
    })
  })
})
