import BN from "bn.js"
import chai from "chai"
import {
  ControllerV2Instance,
  StrategyTestV2Instance,
  MockVaultInstance,
} from "../../../types"
import { eq } from "../../util"
import _setup from "./setup"

contract("Controller", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let controller: ControllerV2Instance
  let strategy: StrategyTestV2Instance
  let vault: MockVaultInstance
  beforeEach(async () => {
    controller = refs.controller
    strategy = refs.strategyV2
    vault = refs.vault
  })

  describe("harvest (v2)", () => {
    const func = "harvest(address,uint256,uint256)"
    const min = 1
    const max = 2

    it("should harvest", async () => {
      await controller.methods[func](strategy.address, min, max, { from: admin })
      assert(await strategy._harvestWasCalled_(), "harvest")
      assert(eq(await strategy._harvestMin_(), min), "min")
      assert(eq(await strategy._harvestMax_(), max), "max")
    })

    it("should reject if not current strategy", async () => {
      // mock strategy address
      await vault.setStrategy(accounts[1], new BN(0))
      await chai
        .expect(controller.methods[func](strategy.address, min, max, { from: admin }))
        .to.be.rejectedWith("!strategy")
    })

    it("should reject if caller not authorized", async () => {
      await chai
        .expect(
          controller.methods[func](strategy.address, min, max, { from: accounts[1] })
        )
        .to.be.rejectedWith("!authorized")
    })

    it("should reject invalid strategy address", async () => {
      await chai.expect(
        controller.methods[func](accounts[1], min, max, { from: admin })
      ).to.be.rejected
    })
  })
})
