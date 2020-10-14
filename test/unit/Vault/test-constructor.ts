import chai from "chai"
import BN from "bn.js"
import {Erc20TokenInstance} from "../../../types/Erc20Token"
import {VaultInstance} from "../../../types/Vault"
import {MockControllerInstance} from "../../../types/MockController"
import {ZERO_ADDRESS, eq} from "../../util"
import _setup from "./setup"

const Vault = artifacts.require("Vault")

contract("Vault", (accounts) => {
  const MIN_WAIT_TIME = 0

  const refs = _setup(accounts, MIN_WAIT_TIME)
  const {admin} = refs

  let controller: MockControllerInstance
  let vault: VaultInstance
  let erc20: Erc20TokenInstance
  beforeEach(() => {
    controller = refs.controller
    vault = refs.vault
    erc20 = refs.erc20
  })

  describe("constructor", () => {
    it("should deploy", async () => {
      const vault = await Vault.new(controller.address, erc20.address, MIN_WAIT_TIME)

      assert.equal(await vault.admin(), admin, "admin")
      assert.equal(await vault.controller(), controller.address, "controller")
      assert.equal(await vault.token(), erc20.address, "token")
      assert(eq(await vault.minWaitTime(), new BN(MIN_WAIT_TIME)), "min wait time")

      assert.equal(await vault.name(), "unagii_test", "name")
      assert.equal(await vault.symbol(), "uTEST", "symbol")
      assert(eq(await vault.decimals(), await erc20.decimals()), "decimals")

      assert.equal(await vault.strategy(), ZERO_ADDRESS, "strategy")
      assert(eq(await vault.timeLock(), new BN(0)), "time lock")
    })

    it("should reject if controller is zero address", async () => {
      await chai.expect(Vault.new(ZERO_ADDRESS, erc20.address, MIN_WAIT_TIME)).to.be.rejected
    })

    it("should reject if token is zero address", async () => {
      await chai.expect(Vault.new(controller.address, ZERO_ADDRESS, MIN_WAIT_TIME)).to.be
        .rejected
    })
  })
})
