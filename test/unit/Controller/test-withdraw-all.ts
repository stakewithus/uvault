import BN from "bn.js"
import chai from "chai"
import {
  ControllerInstance,
  StrategyTestInstance,
  MockVaultInstance,
} from "../../../types"
import { add, eq } from "../../util"
import _setup from "./setup"

contract("Controller", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let controller: ControllerInstance
  let strategy: StrategyTestInstance
  let vault: MockVaultInstance
  beforeEach(() => {
    controller = refs.controller
    strategy = refs.strategy
    vault = refs.vault
  })

  describe("withdrawAll", () => {
    it("should withdrawAll", async () => {
      await controller.withdrawAll(strategy.address, 0, { from: admin })

      // check that strategy withdraw was called
      assert(eq(await strategy.totalAssets(), new BN(0)), "withdraw")
    })

    it("should reject if not current strategy", async () => {
      // mock strategy address
      await vault.setStrategy(accounts[1], new BN(0))

      await chai
        .expect(controller.withdrawAll(strategy.address, 0, { from: admin }))
        .to.be.rejectedWith("!strategy")
    })

    it("should reject if withdraw < min", async () => {
      const bal = await strategy.totalAssets()
      const min = add(bal, 1)

      await chai
        .expect(controller.withdrawAll(strategy.address, min, { from: admin }))
        .to.be.rejectedWith("withdraw < min")
    })

    it("should reject if caller not authorized", async () => {
      await chai
        .expect(controller.withdrawAll(strategy.address, 0, { from: accounts[1] }))
        .to.be.rejectedWith("!authorized")
    })

    it("should reject invalid strategy address", async () => {
      await chai.expect(controller.withdrawAll(accounts[1], 0, { from: admin })).to.be
        .rejected
    })
  })
})
