import chai from "chai"
import BN from "bn.js"
import {MockTimeLockInstance} from "../../../types"
import {Erc20TokenInstance} from "../../../types/Erc20Token"
import {VaultInstance} from "../../../types/Vault"
import {MockControllerInstance} from "../../../types/MockController"
import {StrategyTestInstance} from "../../../types/StrategyTest"
import {ZERO_ADDRESS, eq, timeout, MAX_UINT} from "../../util"
import _setup from "./setup"

const StrategyTest = artifacts.require("StrategyTest")

contract("Vault", (accounts) => {
  const refs = _setup(accounts)
  const {admin} = refs

  let controller: MockControllerInstance
  let timeLock: MockTimeLockInstance
  let vault: VaultInstance
  let token: Erc20TokenInstance
  let strategy: StrategyTestInstance
  beforeEach(() => {
    controller = refs.controller
    timeLock = refs.timeLock
    vault = refs.vault
    token = refs.token
    strategy = refs.strategy
  })

  describe("setStrategy", () => {
    beforeEach(async () => {
      await timeLock._approveStrategy_(vault.address, strategy.address)
    })

    it("should set new strategy", async () => {
      const tx = await vault.setStrategy(strategy.address, new BN(0), {
        from: admin,
      })

      // check log
      assert.equal(tx.logs[0].event, "SetStrategy", "event")
      assert.equal(
        // @ts-ignore
        tx.logs[0].args.strategy,
        strategy.address,
        "log strategy"
      )
      // check state
      assert.equal(await vault.strategy(), strategy.address, "strategy")
      // check external calls
      assert.equal(await strategy._exitWasCalled_(), false, "exit")
    })

    describe("update", () => {
      let oldStrategy: StrategyTestInstance
      let newStrategy: StrategyTestInstance
      beforeEach(async () => {
        oldStrategy = strategy
        newStrategy = await StrategyTest.new(
          controller.address,
          vault.address,
          token.address,
          {from: admin}
        )

        const min = await vault.balanceInStrategy()
        await vault.setStrategy(oldStrategy.address, min, {from: admin})
        await timeLock._approveStrategy_(vault.address, newStrategy.address)
      })

      it("should update strategy", async () => {
        const min = await vault.balanceInStrategy()
        await vault.setStrategy(newStrategy.address, min, {from: admin})

        // check state
        assert.equal(await vault.strategy(), newStrategy.address, "new strategy")
        assert(eq(await vault.totalDebt(), new BN(0)), "total debt")
        // check external calls
        assert(
          eq(await token.allowance(vault.address, oldStrategy.address), new BN(0)),
          "allowance"
        )
        assert.equal(await oldStrategy._exitWasCalled_(), true, "exit")
      })

      it("should switch to approved strategy", async () => {
        await vault.setStrategy(newStrategy.address, new BN(0), {from: admin})
        assert.equal(await vault.strategy(), newStrategy.address, "new strategy")

        await vault.setStrategy(oldStrategy.address, new BN(0), {from: admin})
        assert.equal(await vault.strategy(), oldStrategy.address, "old strategy")
      })

      it("should reject if exit amount < min", async () => {
        // simulate token in vault
        await token.mint(oldStrategy.address, 123)
        // simulate transfer < balance of strategy
        await oldStrategy._setMaxTransferAmount_(1)

        await chai
          .expect(vault.setStrategy(newStrategy.address, new BN(2), {from: admin}))
          .to.be.rejectedWith("withdraw < min")
      })
    })

    it("should reject if not authorized", async () => {
      await chai
        .expect(vault.setStrategy(strategy.address, new BN(0), {from: accounts[1]}))
        .to.be.rejectedWith("!authorized")
    })

    it("should reject if strategy is equal to current strategy", async () => {
      await vault.setStrategy(strategy.address, new BN(0), {from: admin})

      await chai
        .expect(vault.setStrategy(strategy.address, new BN(0), {from: admin}))
        .to.be.rejectedWith("new strategy = current strategy")
    })

    it("should reject if vault.token != strategy.token", async () => {
      await strategy._setUnderlying_(accounts[0])

      await chai
        .expect(vault.setStrategy(strategy.address, new BN(0), {from: admin}))
        .to.be.rejectedWith("strategy.token != vault.token")
    })

    it("should reject if strategy.vault != vault", async () => {
      await strategy._setVault_(accounts[0])

      await chai
        .expect(vault.setStrategy(strategy.address, new BN(0), {from: admin}))
        .to.be.rejectedWith("strategy.vault != vault")
    })

    it("should reject if strategy not approved", async () => {
      const strategy = await StrategyTest.new(
        controller.address,
        vault.address,
        token.address,
        {
          from: admin,
        }
      )

      await chai
        .expect(vault.setStrategy(strategy.address, new BN(0), {from: admin}))
        .to.be.rejectedWith("!approved")
    })
  })
})
