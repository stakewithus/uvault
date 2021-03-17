import chai from "chai"
import { StrategyERC20SplitInstance } from "../../../types"
import { ZERO_ADDRESS } from "../../util"
import _setup from "./setup"

contract("StrategyERC20Split", (accounts) => {
  const refs = _setup(accounts)
  const { timeLock } = refs

  let split: StrategyERC20SplitInstance
  beforeEach(() => {
    split = refs.split
  })

  describe("setTimeLock", () => {
    it("should set controller", async () => {
      await split.setTimeLock(accounts[1], { from: timeLock })

      assert.equal(await split.timeLock(), accounts[1])
    })

    it("should reject if caller not time lock", async () => {
      await chai
        .expect(split.setTimeLock(accounts[1], { from: accounts[1] }))
        .to.be.rejectedWith("!timeLock")
    })

    it("should reject zero address", async () => {
      await chai
        .expect(split.setTimeLock(ZERO_ADDRESS, { from: timeLock }))
        .to.be.rejectedWith("time lock = zero address")
    })
  })
})
