import chai from "chai"
import {
  TestTokenInstance,
  StrategyERC20SplitInstance,
  StrategyERC20V3TestInstance,
} from "../../../types"
import { eq, pow, mul, frac } from "../../util"
import _setup from "./setup"

contract("StrategyERC20Split", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let split: StrategyERC20SplitInstance
  let strategies: StrategyERC20V3TestInstance[]
  let underlying: TestTokenInstance
  let vault: string
  beforeEach(() => {
    split = refs.split
    strategies = refs.strategies
    underlying = refs.underlying
    vault = refs.vault
  })

  describe("deposit", () => {
    const amount = mul(pow(10, 18), 3)

    beforeEach(async () => {
      await underlying._mint_(vault, amount)
      await underlying._approve_(vault, split.address, amount)
    })

    it("should deposit", async () => {
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

      const before = await snapshot()
      await split.deposit(amount, { from: admin })
      const after = await snapshot()

      // check underlying balance
      const totalDepositRatio = await split.totalDepositRatio()
      for (const strategy of strategies) {
        const strat = await split.strategies(strategy.address)
        // @ts-ignore
        const deposit = frac(amount, strat.depositRatio, totalDepositRatio)
        assert(eq(await strategy.totalAssets(), deposit), "strategy total assets")
      }

      assert(
        after.underlying.vault.eq(before.underlying.vault.sub(amount)),
        "underlying vault"
      )

      // check total assets
      assert(
        after.split.totalAssets.eq(before.split.totalAssets.add(amount)),
        "total assets"
      )
      // check total debt
      assert(after.split.totalDebt.eq(before.split.totalDebt.add(amount)), "total debt")
    })

    it("should reject if caller not authorized", async () => {
      await chai
        .expect(split.deposit(amount, { from: accounts[1] }))
        .to.be.rejectedWith("!authorized")
    })

    it("should reject if amount = 0", async () => {
      await chai
        .expect(split.deposit(0, { from: admin }))
        .to.be.rejectedWith("deposit = 0")
    })
  })
})
