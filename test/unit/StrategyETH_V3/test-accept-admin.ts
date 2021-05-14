import chai from "chai"
import { StrategyETHV3TestInstance } from "../../../types"
import { ZERO_ADDRESS } from "../../util"
import _setup from "./setup"

contract("StrategyETH_V3", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let strategy: StrategyETHV3TestInstance
  beforeEach(async () => {
    strategy = refs.strategy
    await strategy.setNextAdmin(accounts[1], { from: admin })
  })

  describe("acceptAdmin", () => {
    it("should set admin", async () => {
      await strategy.acceptAdmin({ from: accounts[1] })
      assert.equal(await strategy.admin(), accounts[1])
      assert.equal(await strategy.nextAdmin(), ZERO_ADDRESS)
    })

    it("should reject if caller not next admin", async () => {
      await chai
        .expect(strategy.acceptAdmin({ from: accounts[2] }))
        .to.be.rejectedWith("!next admin")
    })
  })
})
