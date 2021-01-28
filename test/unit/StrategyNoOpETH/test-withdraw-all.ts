import chai from "chai"
import BN from "bn.js"
import { StrategyNoOpETHInstance } from "../../../types"
import { eq } from "../../util"
import _setup from "./setup"

contract("StrategyNoOpETH", (accounts) => {
  const refs = _setup(accounts)
  const { admin, vault } = refs

  let strategy: StrategyNoOpETHInstance
  beforeEach(async () => {
    strategy = refs.strategy

    // Cannot sent ETH to this contract
    // await strategy.sendTransaction({ from: admin, value: new BN(123) })
  })

  describe("withdrawAll", () => {
    it("should withdraw all", async () => {
      const snapshot = async () => {
        return {
          eth: {
            vault: new BN(await web3.eth.getBalance(vault)),
            strategy: new BN(await web3.eth.getBalance(strategy.address)),
          },
        }
      }

      const before = await snapshot()
      await strategy.withdrawAll({ from: admin })
      const after = await snapshot()

      assert(eq(after.eth.vault, before.eth.vault), "vault")
      assert(eq(after.eth.strategy, new BN(0)), "strategy")
    })

    it("should reject if not authorized", async () => {
      await chai
        .expect(strategy.withdrawAll({ from: accounts[3] }))
        .to.be.rejectedWith("!authorized")
    })
  })
})
