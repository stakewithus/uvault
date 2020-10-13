import chai from "chai"
import {MockControllerInstance} from "../../../types/MockController"
import {MockVaultInstance} from "../../../types/MockVault"
import { ZERO_ADDRESS } from "../../util"
import _setup from "./setup"

const BaseStrategy = artifacts.require("BaseStrategy")

contract("BaseStrategy", (accounts) => {
  const refs = _setup(accounts)
  const {admin} = refs

  let vault: MockVaultInstance
  let controller:MockControllerInstance
  beforeEach(() => {
    vault = refs.vault
    controller = refs.controller
  })

  describe("constructor", () => {
    it("should deploy", async () => {
      const strategy = await BaseStrategy.new(controller.address, vault.address)

      assert.equal(await strategy.admin(), admin, "admin")
      assert.equal(await strategy.controller(), controller.address, "controller")
      assert.equal(await strategy.vault(), vault.address, "vault")
    })

    it("should not deploy if controller is zero address", async () => {
      await chai.expect(BaseStrategy.new(ZERO_ADDRESS, vault.address)).to.be.rejectedWith(
        "controller = zero address"
      )
    })

    it("should not deploy if vault is zero address", async () => {
      await chai.expect(
        BaseStrategy.new(controller.address, ZERO_ADDRESS)
      ).to.be.rejectedWith("vault = zero address")
    })
  })
})
