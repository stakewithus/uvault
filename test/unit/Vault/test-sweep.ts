import chai from "chai"
import BN from "bn.js"
import {Erc20TokenInstance} from "../../../types/Erc20Token"
import {VaultInstance} from "../../../types/Vault"
import {add, sub, eq} from "../../util"
import _setup from "./setup"

const ERC20Token = artifacts.require("ERC20Token")

contract("Vault", (accounts) => {
  const refs = _setup(accounts)
  const {admin} = refs

  const amount = new BN(123)

  let vault: VaultInstance
  let erc20: Erc20TokenInstance
  beforeEach(async () => {
    vault = refs.vault
    // create token != vault.token
    erc20 = await ERC20Token.new()
    await erc20.mint(vault.address, amount)
  })

  describe("sweep", () => {
    it("should withdraw token from vault", async () => {
      const snapshot = async () => {
        return {
          erc20: {
            admin: await erc20.balanceOf(admin),
            vault: await erc20.balanceOf(vault.address),
          },
        }
      }

      const before = await snapshot()
      await vault.sweep(erc20.address, {from: admin})
      const after = await snapshot()

      // check erc20 balance
      assert(eq(after.erc20.admin, add(before.erc20.admin, amount)), "erc20 admin")
      assert(eq(after.erc20.vault, sub(before.erc20.vault, amount)), "erc20 vault")
    })

    it("should reject if not admin", async () => {
      await chai
        .expect(vault.sweep(erc20.address, {from: accounts[1]}))
        .to.be.rejectedWith("!admin")
    })

    it("should reject if token = vault.token", async () => {
      const token = await vault.token()
      await chai
        .expect(vault.sweep(token, {from: admin}))
        .to.be.rejectedWith("token = vault.token")
    })
  })
})
