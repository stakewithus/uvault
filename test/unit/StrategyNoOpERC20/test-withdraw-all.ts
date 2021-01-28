import chai from "chai"
import { StrategyNoOpERC20Instance, TestTokenInstance } from "../../../types"
import { eq, add } from "../../util"
import _setup from "./setup"
import BN from "bn.js"

contract("StrategyNoOpERC20", (accounts) => {
  const refs = _setup(accounts)
  const { admin, vault } = refs

  let strategy: StrategyNoOpERC20Instance
  let underlying: TestTokenInstance
  beforeEach(async () => {
    strategy = refs.strategy
    underlying = refs.underlying

    await underlying._mint_(strategy.address, 123)
  })

  describe("withdrawAll", () => {
    it("should withdraw all", async () => {
      const snapshot = async () => {
        return {
          underlying: {
            vault: await underlying.balanceOf(vault),
            strategy: await underlying.balanceOf(strategy.address),
          },
        }
      }

      const before = await snapshot()
      await strategy.withdrawAll({ from: admin })
      const after = await snapshot()

      assert(
        eq(after.underlying.vault, add(before.underlying.vault, new BN(123))),
        "vault"
      )
      assert(eq(after.underlying.strategy, new BN(0)), "strategy")
    })

    it("should reject if not authorized", async () => {
      await chai
        .expect(strategy.withdrawAll({ from: accounts[3] }))
        .to.be.rejectedWith("!authorized")
    })
  })
})
