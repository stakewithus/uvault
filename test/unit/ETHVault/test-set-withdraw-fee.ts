import chai from "chai"
import BN from "bn.js"
import { ETHVaultInstance } from "../../../types"
import { eq } from "../../util"
import _setup from "./setup"

contract("ETHVault", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let vault: ETHVaultInstance
  beforeEach(() => {
    vault = refs.vault
  })

  describe("setWithdrawFee", () => {
    it("should set withdraw fee", async () => {
      const fee = new BN(123)
      await vault.setWithdrawFee(fee, { from: admin })

      assert.equal(eq(await vault.withdrawFee(), fee), true, "fee")
    })

    it("should reject if caller not admin", async () => {
      await chai
        .expect(vault.setWithdrawFee(123, { from: accounts[1] }))
        .to.be.rejectedWith("!admin")
    })

    it("should reject min > max", async () => {
      await chai
        .expect(vault.setWithdrawFee(501, { from: admin }))
        .to.be.rejectedWith("withdraw fee > cap")
    })
  })
})
