import BN from "bn.js"
import chai from "chai"
import {
  TestTokenInstance,
  MockControllerInstance,
  MockVaultInstance,
} from "../../../types"
import {StrategyTestInstance} from "../../../types/StrategyTest"
import {pow} from "../../util"
import _setup from "./setup"

contract("StrategyBase", (accounts) => {
  const refs = _setup(accounts)
  const {admin} = refs

  let strategy: StrategyTestInstance
  let underlying: TestTokenInstance
  let vault: MockVaultInstance
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
      await underlying._mint_(vault.address, amount)
      await underlying._approve_(vault.address, strategy.address, amount)
      await strategy.deposit(amount, {from: admin})
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

      const before = await snapshot()
      await strategy.skim({from: admin})
      const after = await snapshot()

      assert(
        after.underlying.vault.eq(before.underlying.vault.add(profit)),
        "underlying vault"
      )
      assert(
        after.strategy.totalAssets.eq(before.strategy.totalAssets.sub(profit)),
        "total assets"
      )
      assert(after.strategy.totalDebt.eq(before.strategy.totalDebt), "total debt")
    })

    it("should reject if caller not authorized", async () => {
      await chai
        .expect(strategy.skim({from: accounts[1]}))
        .to.be.rejectedWith("!authorized")
    })
  })
})
