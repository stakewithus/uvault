import chai from "chai"
import { StrategyTestV2Instance, TestTokenInstance } from "../../../types"
import { eq, add } from "../../util"
import _setup from "./setup"
import BN from "bn.js"

const TestToken = artifacts.require("TestToken")

contract("StrategyBaseV2", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let strategy: StrategyTestV2Instance
  let underlying: TestTokenInstance
  // not asset
  let token: TestTokenInstance
  beforeEach(async () => {
    strategy = refs.strategy
    underlying = refs.underlying
    token = await TestToken.new()
  })

  describe("setController", () => {
    beforeEach(async () => {
      await token._mint_(strategy.address, 123)
    })

    it("should sweep", async () => {
      const snapshot = async () => {
        return {
          token: {
            admin: await token.balanceOf(admin),
            strategy: await token.balanceOf(strategy.address),
          },
        }
      }

      const before = await snapshot()
      await strategy.sweep(token.address, { from: admin })
      const after = await snapshot()

      assert(eq(after.token.admin, add(before.token.admin, new BN(123))), "admin")
      assert(eq(after.token.strategy, new BN(0)), "strategy")
    })

    it("should reject if not admin", async () => {
      await chai
        .expect(strategy.sweep(token.address, { from: accounts[1] }))
        .to.be.rejectedWith("!admin")
    })

    it("should reject if asset", async () => {
      await strategy._setAsset_(underlying.address)

      assert(await strategy.assets(underlying.address), "asset")
      await chai
        .expect(strategy.sweep(underlying.address, { from: admin }))
        .to.be.rejectedWith("asset")
    })
  })
})
