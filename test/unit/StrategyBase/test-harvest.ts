import chai from "chai"
import {
  TestTokenInstance,
  MockControllerInstance,
  MockVaultInstance,
} from "../../../types"
import {StrategyTestInstance} from "../../../types/StrategyTest"
import {pow, add, ZERO_ADDRESS} from "../../util"
import _setup from "./setup"

contract("StrategyBase", (accounts) => {
  const refs = _setup(accounts)
  const {admin, treasury} = refs

  let strategy: StrategyTestInstance
  let underlying: TestTokenInstance
  let vault: MockVaultInstance
  let controller: MockControllerInstance
  beforeEach(() => {
    strategy = refs.strategy
    underlying = refs.underlying
    vault = refs.vault
    controller = refs.controller
  })

  describe("harvest", () => {
    const amount = pow(10, 18)

    beforeEach(async () => {
      await underlying._mint_(vault.address, amount)
      await underlying._approve_(vault.address, strategy.address, amount)
      await strategy.deposit(amount, {from: admin})
      // simulate profit from strategy
      await underlying._mint_(strategy.address, amount)
    })

    const snapshot = async () => {
      return {
        underlying: {
          vault: await underlying.balanceOf(vault.address),
          strategy: await underlying.balanceOf(strategy.address),
          treasury: await underlying.balanceOf(treasury),
        },
        strategy: {
          totalDebt: await strategy.totalDebt(),
        },
      }
    }

    it("should transfer to vault", async () => {
      // simulate total underlying > total debt
      await strategy._setTotalDebt_(0)

      const before = await snapshot()
      await strategy.harvest({from: admin})
      const after = await snapshot()

      assert.equal(await strategy._harvestWasCalled_(), true, "harvest")

      // check underlying balance
      assert.equal(
        after.underlying.treasury.gt(before.underlying.treasury),
        true,
        "underlying treasury"
      )

      assert.equal(
        after.underlying.vault.gt(before.underlying.vault),
        true,
        "underlying vault"
      )

      // check total debt
      assert.equal(
        after.strategy.totalDebt.eq(before.strategy.totalDebt),
        true,
        "total debt"
      )
    })

    it("should deposit underlying", async () => {
      // simulate total underlying < total debt
      const debt = add(await strategy.totalAssets(), 1)
      await strategy._setTotalDebt_(debt)

      const before = await snapshot()
      await strategy.harvest({from: admin})
      const after = await snapshot()

      assert.equal(await strategy._harvestWasCalled_(), true, "harvest")

      // check underlying balance
      assert.equal(
        after.underlying.vault.eq(before.underlying.vault),
        true,
        "underlying vault"
      )

      // check total debt
      assert.equal(
        after.strategy.totalDebt.eq(before.strategy.totalDebt),
        true,
        "total debt"
      )
    })

    it("should reject if caller not authorized", async () => {
      await chai
        .expect(strategy.harvest({from: accounts[1]}))
        .to.be.rejectedWith("!authorized")
    })

    it("should reject if treasury is zero address", async () => {
      await controller._setTreasury_(ZERO_ADDRESS)

      await chai
        .expect(strategy.harvest({from: accounts[1]}))
        .to.be.rejectedWith("!authorized")
    })
  })
})
