import chai from "chai"
import { MockControllerInstance } from "../../../types"
import { ZERO_ADDRESS } from "../../util"
import _setup from "./setup"

const StrategyETH_V3_Test = artifacts.require("StrategyETH_V3_Test")

contract("StrategyETH_V3", (accounts) => {
  const refs = _setup(accounts)
  const { admin, keeper } = refs

  let vault: string
  let controller: MockControllerInstance
  beforeEach(() => {
    vault = refs.vault
    controller = refs.controller
  })

  describe("constructor", () => {
    it("should deploy", async () => {
      const strategy = await StrategyETH_V3_Test.new(controller.address, vault, keeper)

      assert.equal(await strategy.admin(), admin, "admin")
      assert.equal(await strategy.controller(), controller.address, "controller")
      assert.equal(await strategy.vault(), vault, "vault")
      assert.equal(await strategy.keeper(), keeper, "keeper")
    })

    it("should not deploy if controller is zero address", async () => {
      await chai
        .expect(StrategyETH_V3_Test.new(ZERO_ADDRESS, vault, keeper))
        .to.be.rejectedWith("controller = zero address")
    })

    it("should not deploy if vault is zero address", async () => {
      await chai
        .expect(StrategyETH_V3_Test.new(controller.address, ZERO_ADDRESS, keeper))
        .to.be.rejectedWith("vault = zero address")
    })

    it("should not deploy if keeper is zero address", async () => {
      await chai
        .expect(StrategyETH_V3_Test.new(controller.address, vault, ZERO_ADDRESS))
        .to.be.rejectedWith("keeper = zero address")
    })
  })
})
