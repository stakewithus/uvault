import chai from "chai"
import { StrategyERC20SplitInstance, TestTokenInstance } from "../../../types"
import { eq, add } from "../../util"
import _setup from "./setup"
import BN from "bn.js"

const TestToken = artifacts.require("TestToken")

contract("StrategyERC20Split", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let split: StrategyERC20SplitInstance
  let underlying: TestTokenInstance
  // not asset
  let token: TestTokenInstance
  beforeEach(async () => {
    split = refs.split
    underlying = refs.underlying
    token = await TestToken.new()
  })

  describe("sweep", () => {
    beforeEach(async () => {
      await token._mint_(split.address, 123)
    })

    it("should sweep", async () => {
      const snapshot = async () => {
        return {
          token: {
            admin: await token.balanceOf(admin),
            split: await token.balanceOf(split.address),
          },
        }
      }

      const before = await snapshot()
      await split.sweep(token.address, { from: admin })
      const after = await snapshot()

      assert(eq(after.token.admin, add(before.token.admin, new BN(123))), "admin")
      assert(eq(after.token.split, new BN(0)), "split")
    })

    it("should reject if not admin", async () => {
      await chai
        .expect(split.sweep(token.address, { from: accounts[1] }))
        .to.be.rejectedWith("!admin")
    })

    it("should reject if protected", async () => {
      await chai
        .expect(split.sweep(underlying.address, { from: admin }))
        .to.be.rejectedWith("protected token")
    })
  })
})
