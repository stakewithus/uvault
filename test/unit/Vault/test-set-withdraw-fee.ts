import chai from "chai"
import BN from "bn.js"
import {VaultInstance} from "../../../types/Vault"
import {eq} from "../../util"
import _setup from "./setup"

contract("Vault", (accounts) => {
  const MIN_WAIT_TIME = 0

  const refs = _setup(accounts, MIN_WAIT_TIME)
  const {admin} = refs

  let vault: VaultInstance
  beforeEach(() => {
    vault = refs.vault
  })

  describe("setWithdrawFee", () => {
    it("should set withdraw fee", async () => {
      const fee = new BN(123)
      await vault.setWithdrawFee(fee, {from: admin})

      assert(eq(await vault.withdrawFee(), fee), "fee")
    })

    it("should reject if caller not admin", async () => {
      await chai.expect(vault.setWithdrawFee(123, {from: accounts[1]})).to.be.rejectedWith(
        "!admin"
      )
    })

    it("should reject min > max", async () => {
      await chai.expect(vault.setWithdrawFee(501, {from: admin})).to.be.rejectedWith(
        "withdraw fee > cap"
      )
    })
  })
})
