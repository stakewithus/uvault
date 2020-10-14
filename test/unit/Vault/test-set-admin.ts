import chai from "chai"
import {Erc20TokenInstance} from "../../../types/Erc20Token"
import {VaultInstance} from "../../../types/Vault"
import {ZERO_ADDRESS} from "../../util"
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

  describe("setAdmin", () => {
    it("should set admin", async () => {
      await vault.setAdmin(accounts[1], {from: admin})

      assert.equal(await vault.admin(), accounts[1])
    })

    it("should reject if caller not admin", async () => {
      await chai
        .expect(vault.setAdmin(accounts[1], {from: accounts[1]}))
        .to.be.rejectedWith("!admin")
    })

    it("should reject zero address", async () => {
      await chai
        .expect(vault.setAdmin(ZERO_ADDRESS, {from: admin}))
        .to.be.rejectedWith("admin = zero address")
    })
  })
})
