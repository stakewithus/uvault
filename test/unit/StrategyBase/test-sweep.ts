import chai from "chai"
import {TestStrategyBaseInstance} from "../../../types/TestStrategyBase"
import {Erc20TokenInstance} from "../../../types/Erc20Token"
import {eq, add} from "../../util"
import _setup from "./setup"
import BN from "bn.js"

contract("BaseStrategy", (accounts) => {
  const refs = _setup(accounts)
  const {admin} = refs

  let strategy: TestStrategyBaseInstance
  let erc20: Erc20TokenInstance
  beforeEach(() => {
    strategy = refs.strategy
    erc20 = refs.erc20
  })

  describe("setController", () => {
    beforeEach(async () => {
      await erc20.mint(strategy.address, 123)
    })

    it("should sweep", async () => {
      const snapshot = async () => {
        return {
          erc20: {
            admin: await erc20.balanceOf(admin),
            strategy: await erc20.balanceOf(strategy.address),
          },
        }
      }

      const before = await snapshot()
      await strategy.sweep(erc20.address, {from: admin})
      const after = await snapshot()

      assert(eq(after.erc20.admin, add(before.erc20.admin, new BN(123))), "admin")
      assert(eq(after.erc20.strategy, new BN(0)), "strategy")
    })

    it("should reject if not admin", async () => {
      await chai
        .expect(strategy.sweep(erc20.address, {from: accounts[1]}))
        .to.be.rejectedWith("!admin")
    })

    it("should reject if asset", async () => {
      await strategy._setAsset_(erc20.address)

      await chai
        .expect(strategy.sweep(erc20.address, {from: admin}))
        .to.be.rejectedWith("asset")
    })
  })
})
