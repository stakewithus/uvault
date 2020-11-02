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
  let token: Erc20TokenInstance
  beforeEach(async () => {
    vault = refs.vault
    // create token != vault.token
    token = await ERC20Token.new()
    await token.mint(vault.address, amount)
  })

  describe("sweep", () => {
    it("should withdraw token from vault", async () => {
      const snapshot = async () => {
        return {
          token: {
            admin: await token.balanceOf(admin),
            vault: await token.balanceOf(vault.address),
          },
        }
      }

      const before = await snapshot()
      await vault.sweep(token.address, {from: admin})
      const after = await snapshot()

      // check token balance
      assert(eq(after.token.admin, add(before.token.admin, amount)), "token admin")
      assert(eq(after.token.vault, sub(before.token.vault, amount)), "token vault")
    })

    it("should reject if not admin", async () => {
      await chai
        .expect(vault.sweep(token.address, {from: accounts[1]}))
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
