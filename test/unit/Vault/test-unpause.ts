import chai from "chai"
import {Erc20TokenInstance} from "../../../types/Erc20Token"
import {VaultInstance} from "../../../types/Vault"
import _setup from "./setup"

contract("Vault", (accounts) => {
  const MIN_WAIT_TIME = 0

  const refs = _setup(accounts, MIN_WAIT_TIME)
  const {admin} = refs

  let vault: VaultInstance
  let erc20: Erc20TokenInstance
  beforeEach(() => {
    vault = refs.vault
    erc20 = refs.erc20
  })

  describe("unpause", () => {
    beforeEach(async () => {
      await vault.pause({from: admin})
    })

    it("should unpause", async () => {
      await vault.unpause({from: admin})
      assert.isFalse(await vault.paused(), "!paused")
    })

    it("should reject if caller not admin", async () => {
      await chai.expect(vault.unpause({from: accounts[1]})).to.be.rejectedWith("!admin")
    })

    it("should reject if not paused", async () => {
      await vault.unpause({from: admin})
      await chai.expect(vault.unpause({from: admin})).to.be.rejectedWith("!paused")
    })
  })
})
