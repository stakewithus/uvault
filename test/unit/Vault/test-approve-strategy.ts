import chai from "chai"
import {MockTimeLockInstance} from "../../../types/MockTimeLock"
import {VaultInstance} from "../../../types/Vault"
import {StrategyTestInstance} from "../../../types/StrategyTest"
import {ZERO_ADDRESS} from "../../util"
import _setup from "./setup"

contract("Vault", (accounts) => {
  const refs = _setup(accounts)

  let timeLock: MockTimeLockInstance
  let vault: VaultInstance
  let strategy: StrategyTestInstance
  beforeEach(() => {
    timeLock = refs.timeLock
    vault = refs.vault
    strategy = refs.strategy
  })

  describe("approveStrategy", () => {
    it("should approve", async () => {
      await timeLock._approveStrategy_(vault.address, strategy.address)

      assert.equal(await vault.strategies(strategy.address), true, "strategy")
    })

    it("should reject if not time lock", async () => {
      await chai
        .expect(vault.approveStrategy(strategy.address, {from: accounts[1]}))
        .to.be.rejectedWith("!time lock")
    })

    it("should reject if zero address", async () => {
      await chai
        .expect(timeLock._approveStrategy_(vault.address, ZERO_ADDRESS))
        .to.be.rejectedWith("strategy = zero address")
    })
  })
})
