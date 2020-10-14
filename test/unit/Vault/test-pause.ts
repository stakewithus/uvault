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

  describe("pause", () => {
    it("should pause", async () => {
      await vault.pause({from: admin})
      assert(await vault.paused(), "paused")
    })

    it("should reject if caller not admin", async () => {
      await chai.expect(vault.pause({from: accounts[1]})).to.be.rejectedWith("!admin")
    })

    it("should reject if paused", async () => {
      await vault.pause({from: admin})
      await chai.expect(vault.pause({from: admin})).to.be.rejectedWith("paused")
    })
  })
})
