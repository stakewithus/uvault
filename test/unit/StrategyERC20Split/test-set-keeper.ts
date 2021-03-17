import chai from "chai"
import { StrategyERC20SplitInstance } from "../../../types"
import { ZERO_ADDRESS } from "../../util"
import _setup from "./setup"

contract("StrategyERC20Split", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let split: StrategyERC20SplitInstance
  beforeEach(() => {
    split = refs.split
  })

  describe("setKeeper", () => {
    it("should set keeper", async () => {
      await split.setKeeper(accounts[1], { from: admin })

      assert.equal(await split.keeper(), accounts[1])
    })

    it("should reject if caller not admin", async () => {
      await chai
        .expect(split.setKeeper(accounts[1], { from: accounts[1] }))
        .to.be.rejectedWith("!admin")
    })

    it("should reject zero address", async () => {
      await chai
        .expect(split.setKeeper(ZERO_ADDRESS, { from: admin }))
        .to.be.rejectedWith("keeper = zero address")
    })
  })
})
