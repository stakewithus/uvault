import chai from "chai"
import BN from "bn.js"
import { StrategyERC20TestInstance } from "../../../types"
import { eq } from "../../util"
import _setup from "./setup"

contract("StrategyERC20", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let strategy: StrategyERC20TestInstance
  beforeEach(() => {
    strategy = refs.strategy
  })

  describe("setDelta", () => {
    const delta = new BN(10000)

    it("should set delta", async () => {
      await strategy.setDelta(delta, { from: admin })

      assert(eq(await strategy.delta(), delta), "delta")
    })

    it("should reject if caller not admin", async () => {
      await chai
        .expect(strategy.setDelta(delta, { from: accounts[1] }))
        .to.be.rejectedWith("!admin")
    })

    it("should reject delta < min", async () => {
      await chai
        .expect(strategy.setDelta(9999, { from: admin }))
        .to.be.rejectedWith("delta < min")
    })
  })
})
