import chai from "chai"
import BN from "bn.js"
import {
  ETHVaultInstance,
  MockControllerInstance,
  StrategyETHTestInstance,
} from "../../../types"
import { ZERO_ADDRESS, pow } from "../../util"
import _setup from "./setup"

contract("ETHVault", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let controller: MockControllerInstance
  let timeLock: string
  let vault: ETHVaultInstance
  let strategy: StrategyETHTestInstance
  beforeEach(() => {
    controller = refs.controller
    timeLock = refs.timeLock
    vault = refs.vault
    strategy = refs.strategy
  })

  describe("invest", () => {
    describe("strategy is set", () => {
      const user = accounts[1]
      const amount = pow(10, 18)

      beforeEach(async () => {
        await vault.deposit({ from: user, value: amount })

        await vault.approveStrategy(strategy.address, { from: timeLock })
        await vault.setStrategy(strategy.address, new BN(0), { from: admin })
      })

      it("should invest", async () => {
        const snapshot = async () => {
          return {
            vault: {
              availableToInvest: await vault.availableToInvest(),
            },
            eth: {
              vault: new BN(await web3.eth.getBalance(vault.address)),
              strategy: new BN(await web3.eth.getBalance(strategy.address)),
            },
          }
        }

        const before = await snapshot()
        await vault.invest({ from: admin })
        const after = await snapshot()

        // check eth transfer to strategy
        assert.equal(
          after.eth.vault.eq(before.eth.vault.sub(before.vault.availableToInvest)),
          true,
          "eth vault"
        )
      })

      it("should reject if available = 0", async () => {
        await vault.invest({ from: admin })
        await chai
          .expect(vault.invest({ from: admin }))
          .to.be.rejectedWith("available = 0")
      })

      it("should reject if not authorized", async () => {
        await chai
          .expect(vault.invest({ from: user }))
          .to.be.rejectedWith("!authorized")
      })

      it("should reject if paused", async () => {
        await vault.setPause(true, { from: admin })
        await chai.expect(vault.invest({ from: admin })).to.be.rejectedWith("paused")
      })
    })

    it("should reject if strategy not set", async () => {
      assert.equal(await vault.strategy(), ZERO_ADDRESS, "strategy")

      await chai
        .expect(vault.invest({ from: admin }))
        .to.be.rejectedWith("strategy = zero address")
    })
  })
})
