import chai from "chai"
import BN from "bn.js"
import { StrategyETHTestInstance } from "../../../types"
import { pow } from "../../util"
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

  describe("deposit", () => {
    const amount = pow(10, 18)

    beforeEach(async () => {})

    it("should deposit", async () => {
      const snapshot = async () => {
        return {
          strategy: {
            totalAssets: await strategy.totalAssets(),
            totalDebt: await strategy.totalDebt(),
          },
        }
      }

      const before = await snapshot()
      await strategy.deposit({ from: vault, value: amount })
      const after = await snapshot()

      // check total assets
      assert(
        after.strategy.totalAssets.eq(before.strategy.totalAssets.add(amount)),
        "total assets"
      )
      // check total debt
      assert(
        after.strategy.totalDebt.eq(before.strategy.totalDebt.add(amount)),
        "total debt"
      )
    })

    it("should reject if caller not authorized", async () => {
      await chai
        .expect(strategy.deposit({ from: accounts[1], value: amount }))
        .to.be.rejectedWith("!authorized")
    })

    it("should reject if amount = 0", async () => {
      await chai
        .expect(strategy.deposit({ from: admin, value: new BN(0) }))
        .to.be.rejectedWith("deposit = 0")
    })
  })
})
