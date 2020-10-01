const BN = require("bn.js")
const {expect} = require("../../setup")
const {eq, add, sub, frac} = require("../../util")
const setup = require("./setup")

const MockStrategy = artifacts.require("MockStrategy")
const ERC20Token = artifacts.require("ERC20Token")

contract("Vault", (accounts) => {
  const refs = setup(accounts)
  const {admin} = refs

  const amount = new BN(123)

  let vault
  let erc20
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
      await expect(vault.sweep(erc20.address, {from: accounts[1]})).to.be.rejectedWith(
        "!admin"
      )
    })

    it("should reject if token = vault.token", async () => {
      const token = await vault.token()
      await expect(vault.sweep(token, {from: admin})).to.be.rejectedWith(
        "token = vault.token"
      )
    })
  })
})
