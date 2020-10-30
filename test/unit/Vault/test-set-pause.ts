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

  describe("setPause", () => {
    it("should pause", async () => {
      await vault.setPause(true, {from: admin})
      assert(await vault.paused(), "paused")
    })

    it("should unpause", async () => {
      await vault.setPause(false, {from: admin})
      assert.equal(await vault.paused(), false, "not paused")
    })

    it("should reject if caller not admin", async () => {
      await chai
        .expect(vault.setPause(true, {from: accounts[1]}))
        .to.be.rejectedWith("!admin")
    })
  })
})
