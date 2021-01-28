import chai from "chai"
import BN from "bn.js"
import { ETHVaultInstance } from "../../../types"
import { pow } from "../../util"
import _setup from "./setup"

contract("ETHVault", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let vault: ETHVaultInstance
  beforeEach(() => {
    vault = refs.vault
  })

  describe("deposit", () => {
    const sender = accounts[1]
    const amount = pow(10, 18)

    const snapshot = async () => {
      return {
        eth: {
          sender: new BN(await web3.eth.getBalance(sender)),
          vault: new BN(await web3.eth.getBalance(vault.address)),
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
      await vault.deposit({ from: sender, value: amount })
      const after = await snapshot()

      // check eth balance (lte to include tx fee)
      assert.equal(
        after.eth.sender.lte(before.eth.sender.sub(amount)),
        true,
        "eth sender"
      )
      assert.equal(after.eth.vault.eq(before.eth.vault.add(amount)), true, "eth vault")

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
      await vault.deposit({ from: sender, value: amount })

      const before = await snapshot()
      await vault.deposit({ from: sender, value: amount })
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
        .expect(vault.deposit({ from: sender, value: amount }))
        .to.be.rejectedWith("paused")
    })

    it("should reject if amount = 0", async () => {
      await chai
        .expect(vault.deposit({ from: sender, value: new BN(0) }))
        .to.be.rejectedWith("deposit = 0")
    })
  })
})
