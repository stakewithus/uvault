import chai from "chai"
import BN from "bn.js"
import {TestStrategyBaseInstance} from "../../../types/TestStrategyBase"
import {eq} from "../../util"
import _setup from "./setup"

contract("BaseStrategy", (accounts) => {
  const refs = _setup(accounts)
  const {admin} = refs

  let strategy: TestStrategyBaseInstance
  beforeEach(() => {
    strategy = refs.strategy
  })

  describe("setPerformanceFee", () => {
    const fee = new BN(500)

    it("should set performance fee", async () => {
      await strategy.setPerformanceFee(fee, {from: admin})

      assert(eq(await strategy.performanceFee(), fee), "fee")
    })

    it("should reject if caller not admin", async () => {
      await chai
        .expect(strategy.setPerformanceFee(fee, {from: accounts[1]}))
        .to.be.rejectedWith("!admin")
    })

    it("should reject fee > max", async () => {
      await chai
        .expect(strategy.setPerformanceFee(10001, {from: admin}))
        .to.be.rejectedWith("performance fee > max")
    })
  })
})
