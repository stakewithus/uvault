import BN from "bn.js"
import chai from "chai"
import {
  TestTokenInstance,
  StrategyERC20SplitInstance,
  StrategyERC20V3TestInstance,
} from "../../../types"
import { pow } from "../../util"
import _setup from "./setup"

contract("StrategyERC20Split", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let split: StrategyERC20SplitInstance
  let strategies: StrategyERC20V3TestInstance[]
  let underlying: TestTokenInstance
  let vault: string
  beforeEach(() => {
    split = refs.split
    strategies = refs.strategies
    underlying = refs.underlying
    vault = refs.vault
  })

  describe("skim", () => {
    const amount = pow(10, 18)

    beforeEach(async () => {
      // simulate profit back in split
      await underlying._mint_(split.address, amount)
    })

    it("should skim", async () => {
      const snapshot = async () => {
        return {
          split: {
            totalDebt: await split.totalDebt(),
          },
        }
      }

      const before = await snapshot()
      await split.skim({ from: admin })
      const after = await snapshot()

      assert(after.split.totalDebt.gt(before.split.totalDebt), "total debt")
    })

    it("should reject if caller not authorized", async () => {
      await chai
        .expect(split.skim({ from: accounts[1] }))
        .to.be.rejectedWith("!authorized")
    })
  })
})
