import chai from "chai"
import { StrategyETHV3TestInstance } from "../../../types"
import { ZERO_ADDRESS } from "../../util"
import _setup from "./setup"

contract("StrategyETH_V3", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let strategy: StrategyETHV3TestInstance
  beforeEach(() => {
    strategy = refs.strategy
  })

  describe("setAdmin", () => {
    it("should set admin", async () => {
      await strategy.setAdmin(accounts[1], { from: admin })

      assert.equal(await strategy.admin(), accounts[1])
    })

    it("should reject if caller not admin", async () => {
      await chai
        .expect(strategy.setAdmin(accounts[1], { from: accounts[1] }))
        .to.be.rejectedWith("!admin")
    })

    it("should reject zero address", async () => {
      await chai
        .expect(strategy.setAdmin(ZERO_ADDRESS, { from: admin }))
        .to.be.rejectedWith("admin = zero address")
    })
  })
})
