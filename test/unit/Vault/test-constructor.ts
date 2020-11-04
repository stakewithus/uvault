import chai from "chai"
import BN from "bn.js"
import {TestTokenInstance} from "../../../types/TestToken"
import {VaultInstance} from "../../../types/Vault"
import {MockControllerInstance} from "../../../types/MockController"
import {MockTimeLockInstance} from "../../../types/MockTimeLock"
import {ZERO_ADDRESS, eq} from "../../util"
import _setup from "./setup"

const Vault = artifacts.require("Vault")

contract("Vault", (accounts) => {
  const refs = _setup(accounts)
  const {admin} = refs

  let controller: MockControllerInstance
  let timeLock: MockTimeLockInstance
  let vault: VaultInstance
  let token: TestTokenInstance
  beforeEach(() => {
    controller = refs.controller
    timeLock = refs.timeLock
    vault = refs.vault
    token = refs.token
  })

  describe("constructor", () => {
    it("should deploy", async () => {
      const vault = await Vault.new(controller.address, timeLock.address, token.address)

      assert.equal(await vault.admin(), admin, "admin")
      assert.equal(await vault.controller(), controller.address, "controller")
      assert.equal(await vault.timeLock(), timeLock.address, "time lock")
      assert.equal(await vault.token(), token.address, "token")

      assert.equal(await vault.name(), "unagii_test", "name")
      assert.equal(await vault.symbol(), "uTEST", "symbol")
      assert.equal(eq(await vault.decimals(), await token.decimals()), true, "decimals")

      assert.equal(await vault.strategy(), ZERO_ADDRESS, "strategy")
    })

    it("should reject if controller is zero address", async () => {
      await chai
        .expect(Vault.new(ZERO_ADDRESS, timeLock.address, token.address))
        .to.be.rejectedWith("controller = zero address")
    })

    it("should reject if time lock is zero address", async () => {
      await chai
        .expect(Vault.new(controller.address, ZERO_ADDRESS, token.address))
        .to.be.rejectedWith("time lock = zero address")
    })

    it("should reject if token is zero address", async () => {
      await chai.expect(Vault.new(controller.address, timeLock.address, ZERO_ADDRESS))
        .to.be.rejected
    })
  })
})
