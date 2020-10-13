const BN = require("bn.js")
const {eq} = require("../../util")
const {getSnapshot} = require("./lib")

module.exports = (name, setup, { DECIMALS }) => {
  contract(name, (accounts) => {
    const depositAmount = new BN(100).mul(new BN(10).pow(DECIMALS))

    const refs = setup(accounts)
    const {vault, treasury, whale} = refs

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

    it("should exit", async () => {
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
      await strategy.exit({from: vault})
      const after = await snapshot()

      assert(eq(after.gauge.strategy, new BN(0)), "gauge strategy")
      // check strategy dust is small
      assert(after.cUnderlying.strategy.lte(new BN(100)), "cUnderlying strategy")
      assert(eq(after.underlying.strategy, new BN(0)), "underlying strategy")
      assert(eq(after.crv.strategy, new BN(0)), "crv strategy")
      assert(after.underlying.vault.gte(before.underlying.vault), "underlying vault")
    })
  })
}