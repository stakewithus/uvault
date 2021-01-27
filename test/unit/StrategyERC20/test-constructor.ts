import chai from "chai"
import { MockControllerInstance, TestTokenInstance } from "../../../types"
import { ZERO_ADDRESS } from "../../util"
import _setup from "./setup"

const StrategyERC20Test = artifacts.require("StrategyERC20Test")

contract("StrategyERC20", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let vault: string
  let controller: MockControllerInstance
  let underlying: TestTokenInstance
  beforeEach(() => {
    vault = refs.vault
    controller = refs.controller
    underlying = refs.underlying
  })

  describe("constructor", () => {
    it("should deploy", async () => {
      const strategy = await StrategyERC20Test.new(
        controller.address,
        vault,
        underlying.address
      )

      assert.equal(await strategy.admin(), admin, "admin")
      assert.equal(await strategy.controller(), controller.address, "controller")
      assert.equal(await strategy.vault(), vault, "vault")
      assert.equal(await strategy.underlying(), underlying.address, "underlying")
    })

    it("should not deploy if controller is zero address", async () => {
      await chai
        .expect(StrategyERC20Test.new(ZERO_ADDRESS, vault, underlying.address))
        .to.be.rejectedWith("controller = zero address")
    })

    it("should not deploy if vault is zero address", async () => {
      await chai
        .expect(
          StrategyERC20Test.new(controller.address, ZERO_ADDRESS, underlying.address)
        )
        .to.be.rejectedWith("vault = zero address")
    })

    it("should not deploy if underlying is zero address", async () => {
      await chai
        .expect(StrategyERC20Test.new(controller.address, vault, ZERO_ADDRESS))
        .to.be.rejectedWith("underlying = zero address")
    })
  })
})
