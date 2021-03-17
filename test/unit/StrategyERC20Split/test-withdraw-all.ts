import BN from "bn.js"
import chai from "chai"
import {
  TestTokenInstance,
  StrategyERC20SplitInstance,
  StrategyERC20TestInstance,
} from "../../../types"
import { pow } from "../../util"
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

  describe("withdrawAll", () => {
    const amount = pow(10, 18)

    beforeEach(async () => {
      for (const strategy of strategies) {
        await underlying._mint_(strategy.address, amount)
      }
    })

    it("should withdraw all", async () => {
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
      await split.withdrawAll({ from: admin })
      const after = await snapshot()

      // check underlying balance
      assert(after.underlying.split.eq(new BN(0)), "underlying split")
      assert(
        after.underlying.vault.eq(
          before.underlying.vault.add(before.split.totalAssets)
        ),
        "underlying vault"
      )
      // check total assets
      assert(after.split.totalAssets.eq(new BN(0)), "total assets")

      // check total debt
      assert(after.split.totalDebt.eq(new BN(0)), "total debt")
    })

    it("should reject if caller not authorized", async () => {
      await chai
        .expect(split.withdrawAll({ from: accounts[1] }))
        .to.be.rejectedWith("!authorized")
    })
  })
})
