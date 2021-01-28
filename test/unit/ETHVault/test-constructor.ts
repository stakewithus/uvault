import chai from "chai"
import { ETHVaultInstance, MockControllerInstance } from "../../../types"
import { ZERO_ADDRESS, eq } from "../../util"
import { ETH } from "../../lib"
import _setup from "./setup"

const ETHVault = artifacts.require("ETHVault")

contract("ETHVault", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let controller: MockControllerInstance
  let timeLock: string
  let vault: ETHVaultInstance
  beforeEach(() => {
    controller = refs.controller
    timeLock = refs.timeLock
    vault = refs.vault
  })

  describe("constructor", () => {
    it("should deploy", async () => {
      const vault = await ETHVault.new(controller.address, timeLock, {
        from: admin,
      })

      assert.equal(await vault.admin(), admin, "admin")
      assert.equal(await vault.controller(), controller.address, "controller")
      assert.equal(await vault.timeLock(), timeLock, "time lock")
      assert.equal(await vault.token(), ETH, "token")

      assert.equal(await vault.name(), "unagii_ETH", "name")
      assert.equal(await vault.symbol(), "uETH", "symbol")
      assert.equal(eq(await vault.decimals(), 18), true, "decimals")

      assert.equal(await vault.strategy(), ZERO_ADDRESS, "strategy")
    })

    it("should reject if controller is zero address", async () => {
      await chai
        .expect(ETHVault.new(ZERO_ADDRESS, timeLock))
        .to.be.rejectedWith("controller = zero address")
    })

    it("should reject if time lock is zero address", async () => {
      await chai
        .expect(ETHVault.new(controller.address, ZERO_ADDRESS))
        .to.be.rejectedWith("time lock = zero address")
    })
  })
})
