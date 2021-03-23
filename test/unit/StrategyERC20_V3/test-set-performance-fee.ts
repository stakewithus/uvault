import chai from "chai"
import BN from "bn.js"
import { StrategyERC20V3TestInstance } from "../../../types"
import { eq } from "../../util"
import _setup from "./setup"

contract("StrategyERC20_V3", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let strategy: StrategyERC20V3TestInstance
  beforeEach(() => {
    strategy = refs.strategy
  })

  describe("setPerformanceFee", () => {
    const fee = new BN(500)

    it("should set performance fee", async () => {
      await strategy.setPerformanceFee(fee, { from: admin })

      assert(eq(await strategy.performanceFee(), fee), "fee")
    })

    it("should reject if caller not admin", async () => {
      await chai
        .expect(strategy.setPerformanceFee(fee, { from: accounts[1] }))
        .to.be.rejectedWith("!admin")
    })

    it("should reject fee > cap", async () => {
      await chai
        .expect(strategy.setPerformanceFee(2001, { from: admin }))
        .to.be.rejectedWith("performance fee > cap")
    })
  })
})
