import chai from "chai"
import {
  MockControllerV2Instance,
  MockVaultInstance,
  TestTokenInstance,
} from "../../../types"
import { ZERO_ADDRESS } from "../../util"
import _setup from "./setup"

const StrategyTest = artifacts.require("StrategyTest")

contract("StrategyBaseV2", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let vault: MockVaultInstance
  let controller: MockControllerV2Instance
  let underlying: TestTokenInstance
  beforeEach(() => {
    vault = refs.vault
    controller = refs.controller
    underlying = refs.underlying
  })

  describe("constructor", () => {
    it("should deploy", async () => {
      const strategy = await StrategyTest.new(
        controller.address,
        vault.address,
        underlying.address
      )

      assert.equal(await strategy.admin(), admin, "admin")
      assert.equal(await strategy.controller(), controller.address, "controller")
      assert.equal(await strategy.vault(), vault.address, "vault")
      assert.equal(await strategy.underlying(), underlying.address, "underlying")
      assert.equal(await strategy.assets(underlying.address), true, "asset")
    })

    it("should not deploy if controller is zero address", async () => {
      await chai
        .expect(StrategyTest.new(ZERO_ADDRESS, vault.address, underlying.address))
        .to.be.rejectedWith("controller = zero address")
    })

    it("should not deploy if vault is zero address", async () => {
      await chai
        .expect(StrategyTest.new(controller.address, ZERO_ADDRESS, underlying.address))
        .to.be.rejectedWith("vault = zero address")
    })

    it("should not deploy if underlying is zero address", async () => {
      await chai
        .expect(StrategyTest.new(controller.address, vault.address, ZERO_ADDRESS))
        .to.be.rejectedWith("underlying = zero address")
    })
  })
})
