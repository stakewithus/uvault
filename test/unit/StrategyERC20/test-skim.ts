import BN from "bn.js"
import chai from "chai"
import {
  TestTokenInstance,
  MockControllerInstance,
  StrategyERC20TestInstance,
} from "../../../types"
import { pow, frac } from "../../util"
import _setup from "./setup"

contract("StrategyERC20", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let strategy: StrategyERC20TestInstance
  let underlying: TestTokenInstance
  let vault: string
  let controller: MockControllerInstance
  beforeEach(() => {
    strategy = refs.strategy
    underlying = refs.underlying
    vault = refs.vault
    controller = refs.controller
  })

  describe("skim", () => {
    const amount = pow(10, 18)

    beforeEach(async () => {
      // deposit to increment debt
      await underlying._mint_(vault, amount)
      await underlying._approve_(vault, strategy.address, amount)
      await strategy.deposit(amount, { from: admin })
    })

    const snapshot = async () => {
      return {
        underlying: {
          vault: await underlying.balanceOf(vault),
          strategy: await underlying.balanceOf(strategy.address),
        },
        strategy: {
          totalDebt: await strategy.totalDebt(),
          totalAssets: await strategy.totalAssets(),
        },
      }
    }

    it("should skim - total assets <= max", async () => {
      // simulate profit
      const profit = new BN(1)
      await underlying._mint_(strategy.address, profit)

      const before = await snapshot()
      await strategy.skim({ from: admin })
      const after = await snapshot()

      assert(after.strategy.totalAssets.eq(before.strategy.totalAssets), "total assets")
      assert(
        after.strategy.totalDebt.eq(before.strategy.totalDebt.add(profit)),
        "total debt"
      )
    })

    it("should skim - total assets > max", async () => {
      // simulate profit
      const profit = frac(await strategy.totalAssets(), 10, 100)
      await underlying._mint_(strategy.address, profit)

      const before = await snapshot()
      await strategy.skim({ from: admin })
      const after = await snapshot()

      const diff = before.underlying.strategy.sub(after.underlying.strategy)

      assert(
        after.strategy.totalAssets.eq(before.strategy.totalAssets.sub(diff)),
        "total assets"
      )
      assert(after.strategy.totalDebt.eq(before.strategy.totalDebt), "total debt")
      assert(after.underlying.vault.eq(before.underlying.vault.add(diff)), "vault")
    })

    it("should reject if caller not authorized", async () => {
      await chai
        .expect(strategy.skim({ from: accounts[1] }))
        .to.be.rejectedWith("!authorized")
    })

    it("should reject if total assets <= debt", async () => {
      await chai
        .expect(strategy.skim({ from: admin }))
        .to.be.rejectedWith("total underlying < debt")
    })
  })
})
