import chai from "chai"
import {MockTimeLockInstance} from "../../../types/MockTimeLock"
import {VaultInstance} from "../../../types/Vault"
import {StrategyTestInstance} from "../../../types/StrategyTest"
import {ZERO_ADDRESS} from "../../util"
import _setup from "./setup"

contract("Vault", (accounts) => {
  const refs = _setup(accounts)
  const {admin} = refs

  let timeLock: MockTimeLockInstance
  let vault: VaultInstance
  let strategy: StrategyTestInstance
  beforeEach(() => {
    timeLock = refs.timeLock
    vault = refs.vault
    strategy = refs.strategy
  })

  describe("revokeStrategy", () => {
    beforeEach(async () => {
      await timeLock._approveStrategy_(vault.address, strategy.address)
    })

    it("should revoke", async () => {
      await vault.revokeStrategy(strategy.address, {from: admin})

      assert.equal(await vault.strategies(strategy.address), false, "strategy")
    })

    it("should reject if not admin", async () => {
      await chai
        .expect(vault.revokeStrategy(strategy.address, {from: accounts[1]}))
        .to.be.rejectedWith("!admin")
    })

    it("should reject if zero address", async () => {
      await chai
        .expect(vault.revokeStrategy(ZERO_ADDRESS, {from: admin}))
        .to.be.rejectedWith("strategy = zero address")
    })
  })
})
