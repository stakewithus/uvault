import BN from "bn.js"
import chai from "chai"
import {TestTokenInstance, MockVaultInstance} from "../../../types"
import {StrategyTestInstance} from "../../../types/StrategyTest"
import {pow} from "../../util"
import _setup from "./setup"

contract("StrategyBase", (accounts) => {
  const refs = _setup(accounts)
  const {admin} = refs

  let strategy: StrategyTestInstance
  let underlying: TestTokenInstance
  let vault: MockVaultInstance
  beforeEach(() => {
    strategy = refs.strategy
    underlying = refs.underlying
    vault = refs.vault
  })

  describe("withdrawAll", () => {
    const amount = pow(10, 18)

    beforeEach(async () => {
      await underlying._mint_(vault.address, amount)
      await underlying._approve_(vault.address, strategy.address, amount)
      await strategy.deposit(amount, {from: admin})
    })

    it("should withdraw all", async () => {
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
      await strategy.withdrawAll({from: admin})
      const after = await snapshot()

      // check underlying balance
      assert.equal(after.underlying.strategy.eq(new BN(0)), true, "underlying strategy")
      assert.equal(
        after.underlying.vault.eq(
          before.underlying.vault.add(before.strategy.totalAssets)
        ),
        true,
        "underlying vault"
      )
      // check total assets
      assert.equal(after.strategy.totalAssets.eq(new BN(0)), true, "total assets")

      // check total debt
      assert.equal(after.strategy.totalDebt.eq(new BN(0)), true, "total debt")
    })

    it("should reject if caller not authorized", async () => {
      await chai
        .expect(strategy.withdrawAll({from: accounts[1]}))
        .to.be.rejectedWith("!authorized")
    })
  })
})
