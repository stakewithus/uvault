import BN from "bn.js"
import chai from "chai"
import { MockControllerInstance, StrategyETHTestInstance } from "../../../types"
import { pow, frac } from "../../util"
import _setup from "./setup"

contract("StrategyETH", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let strategy: StrategyETHTestInstance
  let vault: string
  let controller: MockControllerInstance
  beforeEach(() => {
    strategy = refs.strategy
    vault = refs.vault
    controller = refs.controller
  })

  describe("skim", () => {
    const amount = pow(10, 18)

    beforeEach(async () => {
      // deposit to increment debt
      await strategy.deposit({ from: admin, value: amount })
    })

    const snapshot = async () => {
      return {
        strategy: {
          totalDebt: await strategy.totalDebt(),
          totalAssets: await strategy.totalAssets(),
        },
        eth: {
          vault: new BN(await web3.eth.getBalance(vault)),
        },
      }
    }

    it("should skim - total assets <= max", async () => {
      // simulate profit
      const profit = new BN(1)
      await strategy.sendTransaction({ from: admin, value: profit })

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
      await strategy.sendTransaction({ from: admin, value: profit })

      const before = await snapshot()
      await strategy.skim({ from: admin })
      const after = await snapshot()

      const diff = before.strategy.totalAssets.sub(after.strategy.totalAssets)

      assert(
        after.strategy.totalAssets.eq(before.strategy.totalAssets.sub(diff)),
        "total assets"
      )
      assert(after.strategy.totalDebt.eq(before.strategy.totalDebt), "total debt")
      assert(after.eth.vault.eq(before.eth.vault.add(diff)), "vault")
    })

    it("should reject if caller not authorized", async () => {
      await chai
        .expect(strategy.skim({ from: accounts[1] }))
        .to.be.rejectedWith("!authorized")
    })

    it("should reject if total assets <= debt", async () => {
      await chai
        .expect(strategy.skim({ from: admin }))
        .to.be.rejectedWith("total ETH < debt")
    })
  })
})
