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

  describe("setReserveMin", () => {
    it("should set min", async () => {
      const reserve = new BN(123)
      await vault.setReserveMin(reserve, { from: admin })

      assert.equal(eq(await vault.reserveMin(), reserve), true, "reserve min")
    })

    it("should reject if caller not admin", async () => {
      await chai
        .expect(vault.setReserveMin(123, { from: accounts[1] }))
        .to.be.rejectedWith("!admin")
    })

    it("should reject min > max", async () => {
      await chai
        .expect(vault.setReserveMin(10001, { from: admin }))
        .to.be.rejectedWith("reserve min > max")
    })
  })
})
