import chai from "chai"
import BN from "bn.js"
import {Erc20TokenInstance} from "../../../types/Erc20Token"
import {VaultInstance} from "../../../types/Vault"
import {MockControllerInstance} from "../../../types/MockController"
import {StrategyTestInstance} from "../../../types/StrategyTest"
import {ZERO_ADDRESS, eq, pow} from "../../util"
import _setup from "./setup"

const Vault = artifacts.require("Vault")

contract("Vault", (accounts) => {
  const MIN_WAIT_TIME = 0

  const refs = _setup(accounts, MIN_WAIT_TIME)
  const {admin} = refs

  let controller: MockControllerInstance
  let vault: VaultInstance
  let erc20: Erc20TokenInstance
  let strategy: StrategyTestInstance
  beforeEach(() => {
    controller = refs.controller
    vault = refs.vault
    erc20 = refs.erc20
    strategy = refs.strategy
  })

  describe("invest", () => {
    const user = accounts[1]
    const amount = pow(10, 18)

    beforeEach(async () => {
      await erc20.mint(user, amount)
      await erc20.approve(vault.address, amount, {from: user})
      await vault.deposit(amount, {from: user})

      await vault.setNextStrategy(strategy.address, {from: admin})
      await vault.setStrategy(strategy.address, {from: admin})
    })

    it("should invest", async () => {
      const snapshot = async () => {
        return {
          vault: {
            availableToInvest: await vault.availableToInvest(),
          },
          erc20: {
            admin: await erc20.balanceOf(admin),
            strategy: await erc20.balanceOf(strategy.address),
          },
        }
      }

      const before = await snapshot()
      await vault.invest({from: admin})
      const after = await snapshot()

      // check token transfer to strategy
      assert(eq(after.erc20.strategy, before.vault.availableToInvest), "deposit")
    })

    it("should reject if available = 0", async () => {
      await vault.invest({from: admin})
      await chai.expect(vault.invest({from: admin})).to.be.rejectedWith("available = 0")
    })

    it("should reject if not authorized", async () => {
      await chai.expect(vault.invest({from: user})).to.be.rejectedWith("!authorized")
    })

    it("should reject if paused", async () => {
      await vault.pause({from: admin})
      await chai.expect(vault.invest({from: admin})).to.be.rejectedWith("paused")
    })

    it("should reject if strategy not set", async () => {
      const vault = await Vault.new(controller.address, erc20.address, MIN_WAIT_TIME)
      assert.equal(await vault.strategy(), ZERO_ADDRESS, "strategy")

      await chai
        .expect(vault.invest({from: admin}))
        .to.be.rejectedWith("strategy = zero address")
    })
  })
})
