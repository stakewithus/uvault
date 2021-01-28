import chai from "chai"
import { ERC20VaultInstance, StrategyERC20TestInstance } from "../../../types"
import { ZERO_ADDRESS } from "../../util"
import _setup from "./setup"

contract("ERC20Vault", (accounts) => {
  const refs = _setup(accounts)

  let timeLock: string
  let vault: ERC20VaultInstance
  let strategy: StrategyERC20TestInstance
  beforeEach(() => {
    timeLock = refs.timeLock
    vault = refs.vault
    strategy = refs.strategy
  })

  describe("approveStrategy", () => {
    it("should approve", async () => {
      await vault.approveStrategy(strategy.address, { from: timeLock })

      assert.equal(await vault.strategies(strategy.address), true, "strategy")
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
