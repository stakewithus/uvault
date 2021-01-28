import chai from "chai"
import { MockControllerInstance } from "../../../types"
import { ZERO_ADDRESS } from "../../util"
import { ETH } from "../../lib"
import _setup from "./setup"

const StrategyETHTest = artifacts.require("StrategyETHTest")

contract("StrategyETH", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let vault: string
  let controller: MockControllerInstance
  beforeEach(() => {
    vault = refs.vault
    controller = refs.controller
  })

  describe("constructor", () => {
    it("should deploy", async () => {
      const strategy = await StrategyETHTest.new(controller.address, vault)

      assert.equal(await strategy.admin(), admin, "admin")
      assert.equal(await strategy.controller(), controller.address, "controller")
      assert.equal(await strategy.vault(), vault, "vault")
      assert.equal(await strategy.underlying(), ETH, "underlying")
    })

    it("should not deploy if controller is zero address", async () => {
      await chai
        .expect(StrategyETHTest.new(ZERO_ADDRESS, vault))
        .to.be.rejectedWith("controller = zero address")
    })

    it("should not deploy if vault is zero address", async () => {
      await chai
        .expect(StrategyETHTest.new(controller.address, ZERO_ADDRESS))
        .to.be.rejectedWith("vault = zero address")
    })
  })
})
