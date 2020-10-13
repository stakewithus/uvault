const BN = require("bn.js")
const {eq, sub, frac } = require("../../util")
const {getSnapshot} = require("./lib")

module.exports = (name, setup, { DECIMALS, UNDERLYING_TO_CURVE_DECIMALS }) => {
  contract(name, (accounts) => {
    const refs = setup(accounts)
    const {vault, treasury, whale} = refs

    let underlying
    let cUnderlying
    let gauge
    let crv
    let controller
    let strategy
    beforeEach(() => {
      underlying = refs.underlying
      cUnderlying = refs.cUnderlying
      gauge = refs.gauge
      crv = refs.crv
      controller = refs.controller
      strategy = refs.strategy
    })

    it("should deposit", async () => {
      const depositAmount = new BN(10).pow(DECIMALS)

      // transfer underlying to vault
      await underlying.transfer(vault, depositAmount, {from: whale})

      // approve strategy to spend underlying from vault
      await underlying.approve(strategy.address, depositAmount, {from: vault})

      const snapshot = getSnapshot({
        underlying,
        cUnderlying,
        gauge,
        crv,
        strategy,
        vault,
        treasury,
      })

      const before = await snapshot()
      await strategy.deposit(depositAmount, {from: vault})
      const after = await snapshot()

      // minimum amount of underlying that can be withdrawn
      const minUnderlying = frac(depositAmount, new BN(99), new BN(100))
      // minimum amount of cUnderlying minted
      const minC = frac(depositAmount.mul(UNDERLYING_TO_CURVE_DECIMALS), new BN(95), new BN(100))

      const gaugeDiff = sub(after.gauge.strategy, before.gauge.strategy)
      const underlyingDiff = sub(after.strategy.totalAssets, before.strategy.totalAssets)

      // underlying transferred from vault to strategy
      assert(eq(after.underlying.vault, sub(before.underlying.vault, depositAmount)), "underlying vault")
      assert(underlyingDiff.gte(minUnderlying), "min underlying")
      assert(gaugeDiff.gte(minC), "min gauge")
    })
  })
}