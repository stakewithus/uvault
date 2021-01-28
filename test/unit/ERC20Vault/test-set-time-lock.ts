import chai from "chai"
import { ERC20VaultInstance } from "../../../types"
import { ZERO_ADDRESS } from "../../util"
import _setup from "./setup"

contract("ERC20Vault", (accounts) => {
  const refs = _setup(accounts)

  let vault: ERC20VaultInstance
  let timeLock: string
  beforeEach(() => {
    vault = refs.vault
    timeLock = refs.timeLock
  })

  describe("setTimeLock", () => {
    const newTimeLock = accounts[1]

    it("should set time lock", async () => {
      await vault.setTimeLock(newTimeLock, { from: timeLock })

      assert.equal(await vault.timeLock(), accounts[1])
    })

    it("should reject if caller not time lock", async () => {
      await chai
        .expect(vault.setTimeLock(newTimeLock, { from: accounts[1] }))
        .to.be.rejectedWith("!time lock")
    })

    it("should reject zero address", async () => {
      await chai
        .expect(vault.setTimeLock(ZERO_ADDRESS, { from: timeLock }))
        .to.be.rejectedWith("time lock = zero address")
    })
  })
})
