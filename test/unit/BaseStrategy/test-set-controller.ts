import chai from "chai"
import {BaseStrategyInstance} from "../../../types/BaseStrategy"
import { ZERO_ADDRESS } from "../../util"
import _setup from "./setup"

contract("BaseStrategy", (accounts) => {
  const refs = _setup(accounts)
  const {admin} = refs

  let strategy: BaseStrategyInstance
  beforeEach(() => {
    strategy = refs.strategy
  })

  describe("setController", () => {
    it("should set controller", async () => {
      await strategy.setController(accounts[1], {from: admin})

      assert.equal(await strategy.controller(), accounts[1])
    })

    it("should reject if caller not admin", async () => {
      await chai.expect(
        strategy.setController(accounts[1], {from: accounts[1]})
      ).to.be.rejectedWith("!admin")
    })

    it("should reject zero address", async () => {
      await chai.expect(
        strategy.setController(ZERO_ADDRESS, {from: admin})
      ).to.be.rejectedWith("controller = zero address")
    })
  })
})
