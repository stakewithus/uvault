import chai from "chai"
import {
  TestTokenInstance,
  MockVaultInstance,
  StrategyTestV2Instance,
} from "../../../types"
import { pow, add } from "../../util"
import _setup from "./setup"

contract("StrategyBaseV2", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let strategy: StrategyTestV2Instance
  let underlying: TestTokenInstance
  let vault: MockVaultInstance
  beforeEach(() => {
    strategy = refs.strategy
    underlying = refs.underlying
    vault = refs.vault
  })

  describe("withdraw", () => {
    const amount = pow(10, 18)

    beforeEach(async () => {
      await underlying._mint_(vault.address, amount)
      await underlying._approve_(vault.address, strategy.address, amount)
      await strategy.deposit(amount, { from: admin })
    })

    it("should withdraw", async () => {
      const snapshot = async () => {
        return {
          underlying: {
            vault: await underlying.balanceOf(vault.address),
            strategy: await underlying.balanceOf(strategy.address),
          },
          strategy: {
            totalAssets: await strategy.totalAssets(),
            totalDebt: await strategy.totalDebt(),
          },
        }
      }

      const before = await snapshot()
      await strategy.withdraw(amount, { from: admin })
      const after = await snapshot()

      // check underlying balance
      assert.equal(
        after.underlying.strategy.eq(before.underlying.strategy),
        true,
        "underlying strategy"
      )
      assert.equal(
        after.underlying.vault.eq(before.underlying.vault.add(amount)),
        true,
        "underlying vault"
      )

      // check total assets
      assert.equal(
        after.strategy.totalAssets.eq(before.strategy.totalAssets.sub(amount)),
        true,
        "total assets"
      )

      // check total debt
      assert.equal(
        after.strategy.totalDebt.eq(before.strategy.totalDebt.sub(amount)),
        true,
        "total debt"
      )
    })

    it("should reject if caller not authorized", async () => {
      await chai
        .expect(strategy.withdraw(amount, { from: accounts[1] }))
        .to.be.rejectedWith("!authorized")
    })

    it("should reject if amount = 0", async () => {
      await chai
        .expect(strategy.withdraw(0, { from: admin }))
        .to.be.rejectedWith("underlying = 0")
    })

    it("should reject if amount > total", async () => {
      const amount = add(await strategy.totalAssets(), 1)

      await chai
        .expect(strategy.withdraw(amount, { from: admin }))
        .to.be.rejectedWith("underlying > total")
    })
  })
})