import chai from "chai"
import { TestTokenInstance, StrategyERC20TestInstance } from "../../../types"
import { eq, pow } from "../../util"
import _setup from "./setup"

contract("StrategyERC20", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let strategy: StrategyERC20TestInstance
  let underlying: TestTokenInstance
  let vault: string
  beforeEach(() => {
    strategy = refs.strategy
    underlying = refs.underlying
    vault = refs.vault
  })

  describe("deposit", () => {
    const amount = pow(10, 18)

    beforeEach(async () => {
      await underlying._mint_(vault, amount)
      await underlying._approve_(vault, strategy.address, amount)
    })

    it("should deposit", async () => {
      const snapshot = async () => {
        return {
          underlying: {
            vault: await underlying.balanceOf(vault),
            strategy: await underlying.balanceOf(strategy.address),
          },
          strategy: {
            totalAssets: await strategy.totalAssets(),
            totalDebt: await strategy.totalDebt(),
          },
        }
      }

      const before = await snapshot()
      await strategy.deposit(amount, { from: admin })
      const after = await snapshot()

      // check underlying balance
      assert(
        after.underlying.strategy.eq(before.underlying.strategy.add(amount)),
        "underlying strategy"
      )
      assert(
        after.underlying.vault.eq(before.underlying.vault.sub(amount)),
        "underlying vault"
      )

      // check total assets
      assert(
        after.strategy.totalAssets.eq(before.strategy.totalAssets.add(amount)),
        "total assets"
      )
      // check total debt
      assert(
        after.strategy.totalDebt.eq(before.strategy.totalDebt.add(amount)),
        "total debt"
      )
    })

    it("should reject if caller not authorized", async () => {
      await chai
        .expect(strategy.deposit(amount, { from: accounts[1] }))
        .to.be.rejectedWith("!authorized")
    })

    it("should reject if amount = 0", async () => {
      await chai
        .expect(strategy.deposit(0, { from: admin }))
        .to.be.rejectedWith("deposit = 0")
    })
  })
})
