import chai from "chai"
import BN from "bn.js"
import {
  TestTokenInstance,
  ERC20VaultInstance,
  MockControllerInstance,
} from "../../../types"
import { ZERO_ADDRESS, eq } from "../../util"
import _setup from "./setup"

const ERC20Vault = artifacts.require("ERC20Vault")

contract("ERC20Vault", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let controller: MockControllerInstance
  let timeLock: string
  let vault: ERC20VaultInstance
  let token: TestTokenInstance
  beforeEach(() => {
    controller = refs.controller
    timeLock = refs.timeLock
    vault = refs.vault
    token = refs.token
  })

  describe("constructor", () => {
    it("should deploy", async () => {
      const vault = await ERC20Vault.new(controller.address, timeLock, token.address, {
        from: admin,
      })

      assert.equal(await vault.admin(), admin, "admin")
      assert.equal(await vault.controller(), controller.address, "controller")
      assert.equal(await vault.timeLock(), timeLock, "time lock")
      assert.equal(await vault.token(), token.address, "token")

      assert.equal(await vault.name(), "unagii_test", "name")
      assert.equal(await vault.symbol(), "uTEST", "symbol")
      assert.equal(eq(await vault.decimals(), await token.decimals()), true, "decimals")

      assert.equal(await vault.strategy(), ZERO_ADDRESS, "strategy")
    })

    it("should reject if controller is zero address", async () => {
      await chai
        .expect(ERC20Vault.new(ZERO_ADDRESS, timeLock, token.address))
        .to.be.rejectedWith("controller = zero address")
    })

    it("should reject if time lock is zero address", async () => {
      await chai
        .expect(ERC20Vault.new(controller.address, ZERO_ADDRESS, token.address))
        .to.be.rejectedWith("time lock = zero address")
    })

    it("should reject if token is zero address", async () => {
      await chai.expect(ERC20Vault.new(controller.address, timeLock, ZERO_ADDRESS)).to
        .be.rejected
    })
  })
})
