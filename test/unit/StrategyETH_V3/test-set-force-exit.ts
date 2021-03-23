import chai from "chai"
import { StrategyETHV3TestInstance } from "../../../types"
import _setup from "./setup"

contract("StrategyETH_V3", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let strategy: StrategyETHV3TestInstance
  beforeEach(() => {
    strategy = refs.strategy
  })

  describe("setForceExit", () => {
    it("should set admin", async () => {
      await strategy.setForceExit(true, { from: admin })

      assert.equal(await strategy.forceExit(), true)
    })

    it("should reject if caller not admin", async () => {
      await chai
        .expect(strategy.setForceExit(true, { from: accounts[1] }))
        .to.be.rejectedWith("!admin")
    })
  })
})
