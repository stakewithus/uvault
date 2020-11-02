import chai from "chai"
import {Erc20TokenInstance} from "../../../types/Erc20Token"
import {VaultInstance} from "../../../types/Vault"
import {ZERO_ADDRESS} from "../../util"
import _setup from "./setup"

contract("Vault", (accounts) => {
  const refs = _setup(accounts)
  const {admin} = refs

  let vault: VaultInstance
  let token: Erc20TokenInstance
  beforeEach(() => {
    vault = refs.vault
    token = refs.token
  })

  describe("setController", () => {
    it("should set controller", async () => {
      await vault.setController(accounts[1], {from: admin})

      assert.equal(await vault.controller(), accounts[1])
    })

    it("should reject if caller not controller", async () => {
      await chai
        .expect(vault.setController(accounts[1], {from: accounts[1]}))
        .to.be.rejectedWith("!admin")
    })

    it("should reject zero address", async () => {
      await chai
        .expect(vault.setController(ZERO_ADDRESS, {from: admin}))
        .to.be.rejectedWith("controller = zero address")
    })
  })
})
