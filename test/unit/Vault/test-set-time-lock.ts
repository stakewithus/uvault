import chai from "chai"
import {MockTimeLockInstance} from "../../../types"
import {VaultInstance} from "../../../types/Vault"
import {ZERO_ADDRESS} from "../../util"
import _setup from "./setup"

contract("Vault", (accounts) => {
  const refs = _setup(accounts)

  let vault: VaultInstance
  let timeLock: MockTimeLockInstance
  beforeEach(() => {
    vault = refs.vault
    timeLock = refs.timeLock
  })

  describe("setTimeLock", () => {
    it("should set time lock", async () => {
      await timeLock._setTimeLock_(vault.address, accounts[1])

      assert.equal(await vault.timeLock(), accounts[1])
    })

    it("should reject if caller not time lock", async () => {
      await chai
        .expect(vault.setTimeLock(accounts[1], {from: accounts[1]}))
        .to.be.rejectedWith("!time lock")
    })

    it("should reject zero address", async () => {
      await chai
        .expect(timeLock._setTimeLock_(vault.address, ZERO_ADDRESS))
        .to.be.rejectedWith("time lock = zero address")
    })
  })
})
