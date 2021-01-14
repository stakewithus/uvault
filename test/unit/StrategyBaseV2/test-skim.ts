import BN from "bn.js"
import chai from "chai"
import {
  TestTokenInstance,
  MockControllerV2Instance,
  MockVaultInstance,
  StrategyTestV2Instance,
} from "../../../types"
import { pow, frac } from "../../util"
import _setup from "./setup"

contract("StrategyBaseV2", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let strategy: StrategyTestV2Instance
  let underlying: TestTokenInstance
  let vault: MockVaultInstance
  let controller: MockControllerV2Instance
  beforeEach(() => {
    strategy = refs.strategy
    underlying = refs.underlying
    vault = refs.vault
    controller = refs.controller
  })

  describe("skim", () => {
    const amount = pow(10, 18)

    beforeEach(async () => {
      await underlying._mint_(vault.address, amount)
      await underlying._approve_(vault.address, strategy.address, amount)
      await strategy.deposit(amount, { from: admin })
    })

    const snapshot = async () => {
      return {
        underlying: {
          vault: await underlying.balanceOf(vault.address),
        },
        strategy: {
          totalDebt: await strategy.totalDebt(),
          totalAssets: await strategy.totalAssets(),
        },
      }
    }

    it("should skim", async () => {
      // simulate profit
      const profit = new BN(123)
      await strategy._mintToPool_(profit)

      const min = frac(await strategy.totalAssets(), 99, 100)
      const max = frac(await strategy.totalAssets(), 101, 100)

      const before = await snapshot()
      await strategy.skim(min, max, { from: admin })
      const after = await snapshot()

      assert(after.strategy.totalAssets.eq(before.strategy.totalAssets), "total assets")
      assert(
        after.strategy.totalDebt.eq(before.strategy.totalDebt.add(profit)),
        "total debt"
      )
    })

    it("should reject if caller not authorized", async () => {
      const min = frac(await strategy.totalAssets(), 99, 100)
      const max = frac(await strategy.totalAssets(), 101, 100)

      await chai
        .expect(strategy.skim(min, max, { from: accounts[1] }))
        .to.be.rejectedWith("!authorized")
    })

    it("should reject if total assets < min", async () => {
      const min = frac(await strategy.totalAssets(), 101, 100)
      const max = frac(await strategy.totalAssets(), 101, 100)

      await chai
        .expect(strategy.skim(min, max, { from: admin }))
        .to.be.rejectedWith("total < min")
    })

    it("should reject if total assets > max", async () => {
      const min = frac(await strategy.totalAssets(), 99, 100)
      const max = frac(await strategy.totalAssets(), 99, 100)

      await chai
        .expect(strategy.skim(min, max, { from: admin }))
        .to.be.rejectedWith("total > max")
    })
  })
})
