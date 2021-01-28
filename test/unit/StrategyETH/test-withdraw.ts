import chai from "chai"
import BN from "bn.js"
import { StrategyETHTestInstance } from "../../../types"
import { pow, add } from "../../util"
import _setup from "./setup"

contract("StrategyETH", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let strategy: StrategyETHTestInstance
  let vault: string
  beforeEach(() => {
    strategy = refs.strategy
    vault = refs.vault
  })

  describe("withdraw", () => {
    const amount = pow(10, 18)

    beforeEach(async () => {
      await strategy.deposit({ from: admin, value: amount })
    })

    it("should withdraw", async () => {
      const snapshot = async () => {
        return {
          eth: {
            vault: new BN(await web3.eth.getBalance(vault)),
            strategy: new BN(await web3.eth.getBalance(strategy.address)),
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

      // check eth balance
      assert(after.eth.strategy.lte(before.eth.strategy), "eth strategy")
      assert(after.eth.vault.eq(before.eth.vault.add(amount)), "eth vault")

      // check total assets
      assert(
        after.strategy.totalAssets.eq(before.strategy.totalAssets.sub(amount)),
        "total assets"
      )

      // check total debt
      assert(
        after.strategy.totalDebt.eq(before.strategy.totalDebt.sub(amount)),
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
        .to.be.rejectedWith("withdraw = 0")
    })

    it("should reject if amount > total", async () => {
      const amount = add(await strategy.totalAssets(), 1)

      await chai
        .expect(strategy.withdraw(amount, { from: admin }))
        .to.be.rejectedWith("withdraw > total")
    })
  })
})
