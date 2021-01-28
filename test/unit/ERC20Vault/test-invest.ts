import chai from "chai"
import BN from "bn.js"
import {
  TestTokenInstance,
  ERC20VaultInstance,
  MockControllerInstance,
  StrategyERC20TestInstance,
} from "../../../types"
import { ZERO_ADDRESS, eq, pow } from "../../util"
import _setup from "./setup"

contract("ERC20Vault", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let controller: MockControllerInstance
  let timeLock: string
  let vault: ERC20VaultInstance
  let token: TestTokenInstance
  let strategy: StrategyERC20TestInstance
  beforeEach(() => {
    controller = refs.controller
    timeLock = refs.timeLock
    vault = refs.vault
    token = refs.token
    strategy = refs.strategy
  })

  describe("invest", () => {
    describe("strategy is set", () => {
      const user = accounts[1]
      const amount = pow(10, 18)

      beforeEach(async () => {
        await token._mint_(user, amount)
        await token.approve(vault.address, amount, { from: user })
        await vault.deposit(amount, { from: user })

        await vault.approveStrategy(strategy.address, { from: timeLock })
        await vault.setStrategy(strategy.address, new BN(0), { from: admin })
      })

      it("should invest", async () => {
        const snapshot = async () => {
          return {
            vault: {
              availableToInvest: await vault.availableToInvest(),
            },
            token: {
              vault: await token.balanceOf(vault.address),
              strategy: await token.balanceOf(strategy.address),
            },
          }
        }

        const before = await snapshot()
        await vault.invest({ from: admin })
        const after = await snapshot()

        // check token transfer to strategy
        assert.equal(
          after.token.vault.eq(before.token.vault.sub(before.vault.availableToInvest)),
          true,
          "token vault"
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
