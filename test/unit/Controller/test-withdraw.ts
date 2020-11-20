import BN from "bn.js"
import chai from "chai"
import {
  ControllerInstance,
  StrategyTestInstance,
  MockVaultInstance,
} from "../../../types"
import { add } from "../../util"
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

  const amount = new BN(1)
  const min = new BN(0)

  describe("withdraw", () => {
    it("should withdraw", async () => {
      const before = await strategy.totalAssets()
      await controller.withdraw(strategy.address, amount, min, {
        from: admin,
      })
      const after = await strategy.totalAssets()

      // check that strategy withdraw was called
      assert(after.eq(before.sub(amount)), "withdraw")
    })

    it("should reject if not current strategy", async () => {
      // mock strategy address
      await vault.setStrategy(accounts[1], new BN(0))

      await chai
        .expect(controller.withdraw(strategy.address, amount, min, { from: admin }))
        .to.be.rejectedWith("!strategy")
    })

    it("should reject if withdraw < min", async () => {
      const amount = await strategy.totalAssets()
      const min = add(amount, 1)

      await chai
        .expect(controller.withdraw(strategy.address, amount, min, { from: admin }))
        .to.be.rejectedWith("withdraw < min")
    })

    it("should reject if caller not authorized", async () => {
      await chai
        .expect(
          controller.withdraw(strategy.address, amount, min, { from: accounts[1] })
        )
        .to.be.rejectedWith("!authorized")
    })

    it("should reject invalid strategy address", async () => {
      await chai.expect(controller.withdraw(accounts[1], amount, min, { from: admin }))
        .to.be.rejected
    })
  })
})
