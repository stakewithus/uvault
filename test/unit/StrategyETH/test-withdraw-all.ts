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

  describe("withdrawAll", () => {
    const amount = pow(10, 18)

    beforeEach(async () => {
      await strategy.deposit({ from: admin, value: amount })
    })

    it("should withdraw all", async () => {
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
      await strategy.withdrawAll({ from: admin })
      const after = await snapshot()

      // check eth balance
      assert(after.eth.strategy.eq(new BN(0)), "eth strategy")
      assert(
        after.eth.vault.eq(before.eth.vault.add(before.strategy.totalAssets)),
        "eth vault"
      )
      // check total assets
      assert(after.strategy.totalAssets.eq(new BN(0)), "total assets")

      // check total debt
      assert(after.strategy.totalDebt.eq(new BN(0)), "total debt")
    })

    it("should reject if caller not authorized", async () => {
      await chai
        .expect(strategy.withdrawAll({ from: accounts[1] }))
        .to.be.rejectedWith("!authorized")
    })
  })
})
