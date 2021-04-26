import chai from "chai"
import { StrategyERC20SplitInstance, StrategyERC20V3TestInstance } from "../../../types"
import { eq } from "../../util"
import _setup from "./setup"

contract("StrategyERC20Split", (accounts) => {
  const refs = _setup(accounts)
  const { keeper } = refs

  let split: StrategyERC20SplitInstance
  let strategies: StrategyERC20V3TestInstance[]
  beforeEach(async () => {
    split = refs.split
    strategies = refs.strategies
  })

  describe("setDepositRatios", () => {
    it("should set deposit ratios", async () => {
      const depositRatios = [100, 200, 300]

      await split.setDepositRatios(depositRatios, { from: keeper })

      for (let i = 0; i < depositRatios.length; i++) {
        const addr = strategies[i].address
        const strat = await split.strategies(addr)
        // @ts-ignore
        assert(eq(strat.depositRatio, depositRatios[i]), "deposit ratio")
      }

      assert(eq(await split.totalDepositRatio(), 600), "total deposit ratio")
    })

    it("should reject if not keeper", async () => {
      await chai
        .expect(split.setDepositRatios([], { from: accounts[1] }))
        .to.be.rejectedWith("!keeper")
    })

    it("should reject if length not equal", async () => {
      await chai
        .expect(split.setDepositRatios([], { from: keeper }))
        .to.be.rejectedWith("!depositRatios.length")
    })

    it("should reject if total deposit ratio > max", async () => {
      const depositRatios = [10000, 200, 300]

      await chai
        .expect(split.setDepositRatios(depositRatios, { from: keeper }))
        .to.be.rejectedWith("total deposit ratio > max")
    })
  })
})
