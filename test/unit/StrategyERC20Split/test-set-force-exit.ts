import chai from "chai"
import { StrategyERC20SplitInstance } from "../../../types"
import _setup from "./setup"

contract("StrategyERC20Split", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let split: StrategyERC20SplitInstance
  beforeEach(() => {
    split = refs.split
  })

  describe("setForceExit", () => {
    it("should set admin", async () => {
      await split.setForceExit(true, { from: admin })

      assert.equal(await split.forceExit(), true)
    })

    it("should reject if caller not admin", async () => {
      await chai
        .expect(split.setForceExit(true, { from: accounts[1] }))
        .to.be.rejectedWith("!admin")
    })
  })
})
