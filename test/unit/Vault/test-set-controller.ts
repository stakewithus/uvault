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

  describe("setController", () => {
    it("should set controller", async () => {
      await vault.setController(accounts[1], {from: admin})

      assert.equal(await vault.controller(), accounts[1])
    })

    it("should reject if caller not controller", async () => {
      await chai.expect(
        vault.setController(accounts[1], {from: accounts[1]})
      ).to.be.rejectedWith("!admin")
    })

    it("should reject zero address", async () => {
      await chai.expect(vault.setController(ZERO_ADDRESS, {from: admin})).to.be.rejectedWith(
        "controller = zero address"
      )
    })
  })
})
