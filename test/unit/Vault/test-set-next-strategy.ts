import chai from "chai"
import BN from "bn.js"
import {Erc20TokenInstance} from "../../../types/Erc20Token"
import {VaultInstance} from "../../../types/Vault"
import {MockControllerInstance} from "../../../types/MockController"
import {StrategyTestInstance} from "../../../types/StrategyTest"
import {ZERO_ADDRESS, eq, getBlockTimestamp} from "../../util"
import _setup from "./setup"

const StrategyTest = artifacts.require("StrategyTest")

contract("Vault", (accounts) => {
  const MIN_WAIT_TIME = 100

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

  describe("setNextStrategy", () => {
    it("should set next strategy when current strategy is not set", async () => {
      const tx = await vault.setNextStrategy(strategy.address, {from: admin})

      assert.equal(tx.logs[0].event, "SetNextStrategy", "event")
      assert.equal(
        // @ts-ignore
        tx.logs[0].args.strategy,
        strategy.address,
        "event arg next strategy"
      )
      assert.equal(await vault.nextStrategy(), strategy.address)
      assert(eq(await vault.timeLock(), new BN(0)), "time lock")
    })

    it("should set next strategy when current strategy is set", async () => {
      await vault.setNextStrategy(strategy.address, {from: admin})
      await vault.setStrategy(strategy.address, {from: admin})

      assert.equal(await vault.strategy(), strategy.address, "strategy")

      const newStrategy = await StrategyTest.new(
        controller.address,
        vault.address,
        erc20.address,
        {from: admin}
      )
      const tx = await vault.setNextStrategy(newStrategy.address, {
        from: admin,
      })

      const timestamp = await getBlockTimestamp(web3, tx)

      assert.equal(await vault.nextStrategy(), newStrategy.address, "next strategy")
      assert(eq(await vault.timeLock(), new BN(timestamp + MIN_WAIT_TIME)), "time lock")
    })

    it("should reject if not admin", async () => {
      await chai
        .expect(vault.setNextStrategy(strategy.address, {from: accounts[1]}))
        .to.be.rejectedWith("!admin")
    })

    it("should reject zero address", async () => {
      await chai
        .expect(vault.setNextStrategy(ZERO_ADDRESS, {from: accounts[1]}))
        .to.be.rejectedWith("!admin")
    })

    it("should reject same strategy", async () => {
      await vault.setNextStrategy(strategy.address, {from: admin})

      await chai
        .expect(vault.setNextStrategy(strategy.address, {from: admin}))
        .to.be.rejectedWith("same next strategy")
    })
  })
})
