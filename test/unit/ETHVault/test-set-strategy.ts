import chai from "chai"
import BN from "bn.js"
import {
  ETHVaultInstance,
  MockControllerInstance,
  StrategyETHTestInstance,
} from "../../../types"
import { eq, add } from "../../util"
import _setup from "./setup"

const StrategyETHTest = artifacts.require("StrategyETHTest")

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

  describe("setStrategy", () => {
    beforeEach(async () => {
      await vault.approveStrategy(strategy.address, { from: timeLock })
    })

    it("should set new strategy", async () => {
      const tx = await vault.setStrategy(strategy.address, new BN(0), {
        from: admin,
      })

      // check state
      assert.equal(await vault.strategy(), strategy.address, "strategy")

      // check log
      assert.equal(tx.logs[0].event, "SetStrategy", "event")
      assert.equal(
        // @ts-ignore
        tx.logs[0].args.strategy,
        strategy.address,
        "log strategy"
      )
    })

    describe("update", () => {
      let oldStrategy: StrategyETHTestInstance
      let newStrategy: StrategyETHTestInstance
      beforeEach(async () => {
        oldStrategy = strategy
        newStrategy = await StrategyETHTest.new(controller.address, vault.address, {
          from: admin,
        })

        const min = await vault.balanceInStrategy()
        await vault.setStrategy(oldStrategy.address, min, { from: admin })
        await vault.approveStrategy(newStrategy.address, { from: timeLock })
      })

      it("should update strategy", async () => {
        const min = await vault.balanceInStrategy()
        await vault.setStrategy(newStrategy.address, min, { from: admin })

        // check state
        assert.equal(await vault.strategy(), newStrategy.address, "new strategy")
      })

      it("should reject if exit amount < min", async () => {
        const min = add(await oldStrategy.totalAssets(), 1)

        await chai
          .expect(vault.setStrategy(newStrategy.address, min, { from: admin }))
          .to.be.rejectedWith("withdraw < min")
      })
    })

    it("should reject if not authorized", async () => {
      await chai
        .expect(vault.setStrategy(strategy.address, new BN(0), { from: accounts[1] }))
        .to.be.rejectedWith("!authorized")
    })

    it("should reject if strategy is equal to current strategy", async () => {
      await vault.setStrategy(strategy.address, new BN(0), { from: admin })

      await chai
        .expect(vault.setStrategy(strategy.address, new BN(0), { from: admin }))
        .to.be.rejectedWith("new strategy = current strategy")
    })

    it("should reject if strategy.vault != vault", async () => {
      const strategy = await StrategyETHTest.new(
        controller.address,
        // vault address
        accounts[0],
        { from: admin }
      )
      await vault.approveStrategy(strategy.address, { from: timeLock })

      await chai
        .expect(vault.setStrategy(strategy.address, new BN(0), { from: admin }))
        .to.be.rejectedWith("strategy.vault != vault")
    })

    it("should reject if strategy not approved", async () => {
      const strategy = await StrategyETHTest.new(controller.address, vault.address, {
        from: admin,
      })

      await chai
        .expect(vault.setStrategy(strategy.address, new BN(0), { from: admin }))
        .to.be.rejectedWith("!approved")
    })
  })
})
