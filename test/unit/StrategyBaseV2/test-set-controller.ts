import chai from "chai"
import { StrategyTestV2Instance } from "../../../types"
import { ZERO_ADDRESS } from "../../util"
import _setup from "./setup"

contract("StrategyBaseV2", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let strategy: StrategyTestV2Instance
  beforeEach(() => {
    strategy = refs.strategy
  })

  describe("setController", () => {
    it("should set controller", async () => {
      await strategy.setController(accounts[1], { from: admin })

      assert.equal(await strategy.controller(), accounts[1])
    })

    it("should reject if caller not admin", async () => {
      await chai
        .expect(strategy.setController(accounts[1], { from: accounts[1] }))
        .to.be.rejectedWith("!admin")
    })

    it("should reject zero address", async () => {
      await chai
        .expect(strategy.setController(ZERO_ADDRESS, { from: admin }))
        .to.be.rejectedWith("controller = zero address")
    })
  })
})
