import chai from "chai"
import {MockControllerInstance} from "../../../types/MockController"
import {MockVaultInstance} from "../../../types/MockVault"
import {Erc20TokenInstance} from "../../../types/Erc20Token"
import {ZERO_ADDRESS} from "../../util"
import _setup from "./setup"

const TestStrategyBase = artifacts.require("TestStrategyBase")

contract("StrategyBase", (accounts) => {
  const refs = _setup(accounts)
  const {admin} = refs

  let vault: MockVaultInstance
  let controller: MockControllerInstance
  let underlying: Erc20TokenInstance
  beforeEach(() => {
    vault = refs.vault
    controller = refs.controller
    underlying = refs.underlying
  })

  describe("constructor", () => {
    it("should deploy", async () => {
      const strategy = await TestStrategyBase.new(
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
        .expect(TestStrategyBase.new(ZERO_ADDRESS, vault.address, underlying.address))
        .to.be.rejectedWith("controller = zero address")
    })

    it("should not deploy if vault is zero address", async () => {
      await chai
        .expect(
          TestStrategyBase.new(controller.address, ZERO_ADDRESS, underlying.address)
        )
        .to.be.rejectedWith("vault = zero address")
    })

    it("should not deploy if underlying is zero address", async () => {
      await chai
        .expect(TestStrategyBase.new(controller.address, vault.address, ZERO_ADDRESS))
        .to.be.rejectedWith("underlying = zero address")
    })
  })
})
