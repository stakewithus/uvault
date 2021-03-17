import chai from "chai"
import {
  TestTokenInstance,
  StrategyERC20SplitInstance,
  StrategyERC20TestInstance,
} from "../../../types"
import { pow, add, frac } from "../../util"
import _setup from "./setup"

contract("StrategyERC20Split", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let split: StrategyERC20SplitInstance
  let strategies: StrategyERC20TestInstance[]
  let underlying: TestTokenInstance
  let vault: string
  beforeEach(() => {
    split = refs.split
    strategies = refs.strategies
    underlying = refs.underlying
    vault = refs.vault
  })

  describe("withdraw", () => {
    const amount = pow(10, 3)

    beforeEach(async () => {
      const total = frac(amount, 3, 1)

      await underlying._mint_(vault, total)
      await underlying._approve_(vault, split.address, total)
      await split.deposit(total, { from: admin })
    })

    it("should withdraw", async () => {
      const snapshot = async () => {
        return {
          underlying: {
            vault: await underlying.balanceOf(vault),
            split: await underlying.balanceOf(split.address),
          },
          split: {
            totalAssets: await split.totalAssets(),
            totalDebt: await split.totalDebt(),
          },
        }
      }

      // all from strategy 1 and 2, 50% from strategy 3
      const withdrawAmount = frac(amount, 250, 100)

      const before = await snapshot()
      await split.withdraw(withdrawAmount, { from: admin })
      const after = await snapshot()

      // check underlying balance
      assert(
        after.underlying.vault.eq(before.underlying.vault.add(withdrawAmount)),
        "underlying vault"
      )

      // check total assets
      assert(
        after.split.totalAssets.eq(before.split.totalAssets.sub(withdrawAmount)),
        "total assets"
      )

      // check total debt
      assert(
        after.split.totalDebt.eq(before.split.totalDebt.sub(withdrawAmount)),
        "total debt"
      )
    })

    it("should reject if caller not authorized", async () => {
      await chai
        .expect(split.withdraw(amount, { from: accounts[1] }))
        .to.be.rejectedWith("!authorized")
    })

    it("should reject if amount = 0", async () => {
      await chai
        .expect(split.withdraw(0, { from: admin }))
        .to.be.rejectedWith("withdraw = 0")
    })
  })
})
