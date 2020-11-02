import chai from "chai"
import {Erc20TokenInstance} from "../../../types/Erc20Token"
import {VaultInstance} from "../../../types/Vault"
import {eq, add, sub, pow} from "../../util"
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

  describe("deposit", () => {
    const sender = accounts[1]
    const amount = pow(10, 18)

    beforeEach(async () => {
      await token.mint(sender, amount)
      await token.approve(vault.address, amount, {from: sender})
    })

    it("should deposit when total supply is 0", async () => {
      const snapshot = async () => {
        return {
          token: {
            sender: await token.balanceOf(sender),
            vault: await token.balanceOf(vault.address),
          },
          vault: {
            balanceOf: {
              sender: await vault.balanceOf(sender),
            },
            totalSupply: await vault.totalSupply(),
          },
        }
      }

      const before = await snapshot()
      await vault.deposit(amount, {from: sender})
      const after = await snapshot()

      // check token balance
      assert(eq(after.token.sender, sub(before.token.sender, amount)), "token sender")
      assert(eq(after.token.vault, add(before.token.vault, amount)), "token vault")

      // check vault balance
      assert(
        eq(after.vault.balanceOf.sender, add(before.vault.balanceOf.sender, amount)),
        "vault sender"
      )
      assert(
        eq(after.vault.totalSupply, add(before.vault.totalSupply, amount)),
        "total supply"
      )
    })

    it("should deposit when total supply > 0", async () => {
      const snapshot = async () => {
        return {
          vault: {
            balanceOf: {
              sender: await vault.balanceOf(sender),
            },
            totalSupply: await vault.totalSupply(),
            totalAssets: await vault.totalAssets(),
          },
        }
      }

      await vault.deposit(amount, {from: sender})

      await token.mint(sender, amount)
      await token.approve(vault.address, amount, {from: sender})

      const before = await snapshot()
      await vault.deposit(amount, {from: sender})
      const after = await snapshot()

      // check vault balance
      const shares = amount.mul(before.vault.totalSupply).div(before.vault.totalAssets)
      assert(
        eq(after.vault.balanceOf.sender, add(before.vault.balanceOf.sender, shares)),
        "vault sender"
      )
      assert(
        eq(after.vault.totalSupply, add(before.vault.totalSupply, shares)),
        "total supply"
      )
    })

    it("should reject if paused", async () => {
      await vault.setPause(true, {from: admin})

      await chai
        .expect(vault.deposit(amount, {from: sender}))
        .to.be.rejectedWith("paused")
    })

    it("should reject if amount = 0", async () => {
      await chai
        .expect(vault.deposit(0, {from: sender}))
        .to.be.rejectedWith("amount = 0")
    })
  })
})
