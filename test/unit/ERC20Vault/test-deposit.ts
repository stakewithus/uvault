import chai from "chai"
import { TestTokenInstance, ERC20VaultInstance } from "../../../types"
import { pow } from "../../util"
import _setup from "./setup"

contract("ERC20Vault", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let vault: ERC20VaultInstance
  let token: TestTokenInstance
  beforeEach(() => {
    vault = refs.vault
    token = refs.token
  })

  describe("deposit", () => {
    const sender = accounts[1]
    const amount = pow(10, 18)

    beforeEach(async () => {
      await token._mint_(sender, amount)
      await token.approve(vault.address, amount, { from: sender })
    })

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
          totalAssets: await vault.totalAssets(),
        },
      }
    }

    it("should deposit when total supply is 0", async () => {
      const before = await snapshot()
      await vault.deposit(amount, { from: sender })
      const after = await snapshot()

      // check token balance
      assert.equal(
        after.token.sender.eq(before.token.sender.sub(amount)),
        true,
        "token sender"
      )
      assert.equal(
        after.token.vault.eq(before.token.vault.add(amount)),
        true,
        "token vault"
      )

      // check vault balance
      assert.equal(
        after.vault.balanceOf.sender.eq(before.vault.balanceOf.sender.add(amount)),
        true,
        "vault sender"
      )
      assert.equal(
        after.vault.totalSupply.eq(before.vault.totalSupply.add(amount)),
        true,
        "total supply"
      )
    })

    it("should deposit when total supply > 0", async () => {
      await vault.deposit(amount, { from: sender })

      await token._mint_(sender, amount)
      await token.approve(vault.address, amount, { from: sender })

      const before = await snapshot()
      await vault.deposit(amount, { from: sender })
      const after = await snapshot()

      // check vault balance
      const shares = amount.mul(before.vault.totalSupply).div(before.vault.totalAssets)
      assert.equal(
        after.vault.balanceOf.sender.eq(before.vault.balanceOf.sender.add(shares)),
        true,
        "vault sender"
      )
      assert.equal(
        after.vault.totalSupply.eq(before.vault.totalSupply.add(shares)),
        true,
        "total supply"
      )
    })

    it("should reject if paused", async () => {
      await vault.setPause(true, { from: admin })

      await chai
        .expect(vault.deposit(amount, { from: sender }))
        .to.be.rejectedWith("paused")
    })

    it("should reject if amount = 0", async () => {
      await chai
        .expect(vault.deposit(0, { from: sender }))
        .to.be.rejectedWith("amount = 0")
    })
  })
})
