import chai from "chai"
import {ControllerInstance} from "../../../types/Controller"
import {StrategyTestInstance} from "../../../types/StrategyTest"
import { ZERO_ADDRESS } from "../../util"
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

  describe("setTreasury", () => {
    it("should set treasury", async () => {
      await controller.setTreasury(accounts[2], {from: admin})

      assert.equal(await controller.treasury(), accounts[2])
    })

    it("should reject if caller not admin", async () => {
      await chai.expect(
        controller.setTreasury(accounts[1], {from: accounts[1]})
      ).to.be.rejectedWith("!admin")
    })

    it("should reject zero address", async () => {
      await chai.expect(
        controller.setTreasury(ZERO_ADDRESS, {from: admin})
      ).to.be.rejectedWith("treasury = zero address")
    })
  })
})
