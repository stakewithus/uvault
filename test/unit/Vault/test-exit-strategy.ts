import chai from "chai"
import BN from "bn.js"
import {Erc20TokenInstance} from "../../../types/Erc20Token"
import {VaultInstance} from "../../../types/Vault"
import {StrategyTestInstance} from "../../../types/StrategyTest"
import {eq, add, pow, ZERO_ADDRESS} from "../../util"
import _setup from "./setup"

contract("Vault", (accounts) => {
  const MIN_WAIT_TIME = 0

  const refs = _setup(accounts, MIN_WAIT_TIME)
  const {admin} = refs

  let vault: VaultInstance
  let erc20: Erc20TokenInstance
  let strategy: StrategyTestInstance
  beforeEach(() => {
    vault = refs.vault
    erc20 = refs.erc20
    strategy = refs.strategy
  })

  describe("exitStrategy", () => {
    const amount = pow(10, 18).mul(new BN(100))

    const snapshot = async () => {
      return {
        erc20: {
          vault: await erc20.balanceOf(vault.address),
          strategy: await erc20.balanceOf(strategy.address),
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
        await erc20.mint(vault.address, amount)
        await vault.setNextStrategy(strategy.address, {from: admin})
        await vault.setStrategy(strategy.address, new BN(0), {from: admin})
        await vault.invest({from: admin})
      })

      it("should exit vault", async () => {
        const amount = await vault.balanceInStrategy()
        const min = amount

        const before = await snapshot()
        await vault.exitStrategy(min, {from: admin})
        const after = await snapshot()

        // check erc20 balance
        assert(after.erc20.vault.gte(before.erc20.vault.add(min)), "erc20 vault")
        assert(eq(after.erc20.strategy, new BN(0)), "erc20 strategy")

        // check vault balance
        assert(eq(after.vault.totalDebt, new BN(0)), "total debt")
        assert.equal(await vault.strategy(), ZERO_ADDRESS, "strategy")
      })

      it("should reject if not authorized", async () => {
        const amount = await vault.balanceInStrategy()
        const min = amount

        await chai
          .expect(vault.exitStrategy(min, {from: accounts[1]}))
          .to.be.rejectedWith("!authorized")
      })

      it("should reject if returned amount < min", async () => {
        const amount = await vault.balanceInStrategy()
        const min = add(amount, 1)

        await chai
          .expect(vault.exitStrategy(min, {from: admin}))
          .to.be.rejectedWith("withdraw < min")
      })
    })

    it("should reject if strategy not defined", async () => {
      const amount = await vault.balanceInStrategy()
      const min = amount

      await chai
        .expect(vault.exitStrategy(min, {from: admin}))
        .to.be.rejectedWith("strategy = zero address")
    })
  })
})
