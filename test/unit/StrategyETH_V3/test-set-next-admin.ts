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

  describe("setNextAdmin", () => {
    it("should set next admin", async () => {
      await strategy.setNextAdmin(accounts[1], { from: admin })

      assert.equal(await strategy.nextAdmin(), accounts[1])
    })

    it("should reject if caller not admin", async () => {
      await chai
        .expect(strategy.setNextAdmin(accounts[1], { from: accounts[1] }))
        .to.be.rejectedWith("!admin")
    })

    it("should reject if next admin = current", async () => {
      await chai
        .expect(strategy.setNextAdmin(admin, { from: admin }))
        .to.be.rejectedWith("next admin = current")
    })
  })
})
