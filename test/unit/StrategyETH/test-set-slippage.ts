import chai from "chai"
import BN from "bn.js"
import { StrategyETHTestInstance } from "../../../types"
import { eq } from "../../util"
import _setup from "./setup"

contract("StrategyETH", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let strategy: StrategyETHTestInstance
  beforeEach(() => {
    strategy = refs.strategy
  })

  describe("setSlippage", () => {
    const slippage = new BN(500)

    it("should set slippage", async () => {
      await strategy.setSlippage(slippage, { from: admin })

      assert(eq(await strategy.slippage(), slippage), "slippage")
    })

    it("should reject if caller not admin", async () => {
      await chai
        .expect(strategy.setSlippage(slippage, { from: accounts[1] }))
        .to.be.rejectedWith("!admin")
    })

    it("should reject slippage > max", async () => {
      await chai
        .expect(strategy.setSlippage(10001, { from: admin }))
        .to.be.rejectedWith("slippage > max")
    })
  })
})
