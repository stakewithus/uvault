import chai from "chai"
import BN from "bn.js"
import {Erc20TokenInstance} from "../../../types/Erc20Token"
import {VaultInstance} from "../../../types/Vault"
import {eq} from "../../util"
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

  describe("setWithdrawMin", () => {
    it("should set min", async () => {
      const min = new BN(123)
      await vault.setWithdrawMin(min, {from: admin})

      assert(eq(await vault.withdrawMin(), min), "withdraw min")
    })

    it("should reject if caller not admin", async () => {
      await chai.expect(vault.setWithdrawMin(123, {from: accounts[1]})).to.be.rejectedWith(
        "!admin"
      )
    })

    it("should reject min > max", async () => {
      await chai.expect(vault.setWithdrawMin(10001, {from: admin})).to.be.rejectedWith(
        "withdraw min > max"
      )
    })
  })
})
