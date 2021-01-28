import chai from "chai"
import { ETHVaultInstance, StrategyETHTestInstance } from "../../../types"
import { ZERO_ADDRESS } from "../../util"
import _setup from "./setup"

contract("ETHVault", (accounts) => {
  const refs = _setup(accounts)

  let timeLock: string
  let vault: ETHVaultInstance
  let strategy: StrategyETHTestInstance
  beforeEach(() => {
    timeLock = refs.timeLock
    vault = refs.vault
    strategy = refs.strategy
  })

  describe("approveStrategy", () => {
    it("should approve", async () => {
      const tx = await vault.approveStrategy(strategy.address, { from: timeLock })

      assert.equal(await vault.strategies(strategy.address), true, "strategy")
      // check log
      assert.equal(tx.logs[0].event, "ApproveStrategy", "event")
      assert.equal(
        // @ts-ignore
        tx.logs[0].args.strategy,
        strategy.address,
        "log strategy"
      )
    })

    it("should reject if not time lock", async () => {
      await chai
        .expect(vault.approveStrategy(strategy.address, { from: accounts[1] }))
        .to.be.rejectedWith("!time lock")
    })

    it("should reject if zero address", async () => {
      await chai
        .expect(vault.approveStrategy(ZERO_ADDRESS, { from: timeLock }))
        .to.be.rejectedWith("strategy = zero address")
    })
  })
})
