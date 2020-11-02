import chai from "chai"
import BN from "bn.js"
import {MockTimeLockInstance} from "../../../types"
import {Erc20TokenInstance} from "../../../types/Erc20Token"
import {VaultInstance} from "../../../types/Vault"
import {StrategyTestInstance} from "../../../types/StrategyTest"
import {eq, add, pow} from "../../util"
import _setup from "./setup"

contract("Vault", (accounts) => {
  const refs = _setup(accounts)
  const {admin} = refs

  let timeLock: MockTimeLockInstance
  let vault: VaultInstance
  let token: Erc20TokenInstance
  let strategy: StrategyTestInstance
  beforeEach(() => {
    timeLock = refs.timeLock
    vault = refs.vault
    token = refs.token
    strategy = refs.strategy
  })

  describe("withdrawFromStrategy", () => {
    const amount = pow(10, 18).mul(new BN(100))

    const snapshot = async () => {
      return {
        token: {
          vault: await token.balanceOf(vault.address),
          strategy: await token.balanceOf(strategy.address),
        },
        vault: {
          balanceInStrategy: await vault.balanceInStrategy(),
          balanceInVault: await vault.balanceInVault(),
          totalDebt: await vault.totalDebt(),
        },
      }
    }

    describe("strategy is set", () => {
      beforeEach(async () => {
        await token.mint(vault.address, amount)
        await timeLock._approveStrategy_(vault.address, strategy.address)
        await vault.setStrategy(strategy.address, new BN(0), {from: admin})
        await vault.invest({from: admin})
      })

      it("should withdraw from vault", async () => {
        const balInStrat = await vault.balanceInStrategy()
        const min = balInStrat

        const before = await snapshot()
        await vault.withdrawFromStrategy(balInStrat, min, {from: admin})
        const after = await snapshot()

        // check token balance
        assert.equal(
          after.token.vault.gte(before.token.vault.add(min)),
          true,
          "token vault"
        )
        assert.equal(
          after.token.strategy.lte(before.token.strategy.sub(min)),
          true,
          "token strategy"
        )

        // check vault balance
        const stratDiff = before.token.strategy.sub(after.token.strategy)
        assert.equal(stratDiff.gte(min), true, "strategy diff")
        assert.equal(
          after.vault.totalDebt.eq(before.vault.totalDebt.sub(stratDiff)),
          true,
          "total debt"
        )
      })

      it("should reject if not authorized", async () => {
        const balInStrat = await vault.balanceInStrategy()
        const min = balInStrat

        await chai
          .expect(vault.withdrawFromStrategy(balInStrat, min, {from: accounts[1]}))
          .to.be.rejectedWith("!authorized")
      })

      it("should reject if returned amount < min", async () => {
        const balInStrat = await vault.balanceInStrategy()
        const min = add(balInStrat, 1)

        await chai
          .expect(vault.withdrawFromStrategy(balInStrat, min, {from: admin}))
          .to.be.rejectedWith("withdraw < min")
      })
    })

    it("should reject if strategy not defined", async () => {
      const balInStrat = await vault.balanceInStrategy()
      const min = balInStrat

      await chai
        .expect(vault.withdrawFromStrategy(balInStrat, min, {from: admin}))
        .to.be.rejectedWith("strategy = zero address")
    })
  })
})
