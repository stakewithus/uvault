const BN = require("bn.js")
const {eq, sub, frac } = require("../../util")
const {getSnapshot} = require("./lib")

module.exports = (name, setup, { DECIMALS }) => {
  contract(name, (accounts) => {
    const depositAmount = new BN(10).pow(DECIMALS)

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

    it("should withdraw", async () => {
      const snapshot = getSnapshot({
        underlying,
        cUnderlying,
        crv,
        gauge,
        strategy,
        treasury,
        vault,
      })

      // withdraw amount may be < deposit amount
      // so here we get the maximum redeemable amount
      const withdrawAmount = await strategy.totalAssets()

      const before = await snapshot()
      await strategy.withdraw(withdrawAmount, {from: vault})
      const after = await snapshot()

      // minimum amount of underlying that can be withdrawn
      const minUnderlying = frac(depositAmount, new BN(99), new BN(100))

      // check balance of underlying transferred to treasury and vault
      const fee = sub(after.underlying.treasury, before.underlying.treasury)
      const underlyingDiff = sub(after.underlying.vault, before.underlying.vault)

      assert(fee.gte(new BN(0)), "fee")
      assert(underlyingDiff.gte(minUnderlying), "underlying diff")

      // check strategy does not have any underlying
      assert(eq(after.underlying.strategy, new BN(0)), "underlying strategy")
      // check strategy dust is small
      assert(after.cUnderlying.strategy.lte(new BN(100)), "cUnderlying strategy")
    })
  })
}