const BN = require("bn.js")
const {getSnapshot} = require("./lib")

module.exports = (name, setup, { DECIMALS }) => {
  contract(name, (accounts) => {
    const depositAmount = new BN(100).mul(new BN(10).pow(DECIMALS))

    const refs = setup(accounts)
    const {admin, vault, treasury, whale} = refs

    let underlying
    let cUnderlying
    let gauge
    let crv
    let controller
    let strategy
    beforeEach(async () => {
      underlying = refs.underlying
      cUnderlying = refs.cUnderlying
      gauge = refs.gauge
      crv = refs.crv
      controller = refs.controller
      strategy = refs.strategy

      // deposit underlying into vault
      await underlying.transfer(vault, depositAmount, {from: whale})

      // deposit underlying into strategy
      await underlying.approve(strategy.address, depositAmount, {from: vault})
      await strategy.deposit(depositAmount, {from: vault})
    })

    it("should harvest", async () => {
      const snapshot = getSnapshot({
        underlying,
        cUnderlying,
        gauge,
        crv,
        strategy,
        treasury,
        vault,
      })

      const before = await snapshot()
      await controller.harvest(strategy.address, {from: admin})
      const after = await snapshot()

      assert(after.underlying.treasury.gte(before.underlying.treasury), "underlying treasury")
      assert(
        after.strategy.totalAssets.gte(before.strategy.totalAssets),
        "strategy underlying balance"
      )
      assert(after.gauge.strategy.gte(before.gauge.strategy), "gauge strategy")
      assert(after.crv.strategy.gte(before.crv.strategy), "crv strategy")
    })
  })
}