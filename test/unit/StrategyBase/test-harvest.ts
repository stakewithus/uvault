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
  const {admin} = refs

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
    })

    it("should harvest", async () => {
      await strategy.harvest({from: admin})

      assert.equal(await strategy._harvestWasCalled_(), true, "harvest")
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
