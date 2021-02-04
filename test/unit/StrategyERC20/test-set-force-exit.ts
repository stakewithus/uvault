import chai from "chai"
import { StrategyERC20TestInstance } from "../../../types"
import _setup from "./setup"

contract("StrategyERC20", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let strategy: StrategyERC20TestInstance
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
