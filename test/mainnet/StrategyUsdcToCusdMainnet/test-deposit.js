const BN = require("bn.js")
const {eq, sub, frac, USDC_DECIMALS, USDC_TO_CUSD_DECIMALS} = require("../../util")
const {getSnapshot} = require("../StrategyStableToCurve/lib")
const setup = require("./setup")

const DECIMALS = USDC_DECIMALS
const UNDERLYING_TO_CURVE_DECIMALS = USDC_TO_CUSD_DECIMALS

contract("StrategyUsdcToCusdMainnet", (accounts) => {
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
    const amount = new BN(10).pow(DECIMALS)

    // transfer underlying to vault
    await underlying.transfer(vault, amount, {from: whale})

    // approve strategy to spend underlying from vault
    await underlying.approve(strategy.address, amount, {from: vault})

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
    await strategy.deposit(amount, {from: vault})
    const after = await snapshot()

    // minimum amount of underlying that can be withdrawn
    const minUnderlying = frac(amount, new BN(99), new BN(100))
    // minimum amount of cUnderlying minted
    const minC = frac(amount.mul(UNDERLYING_TO_CURVE_DECIMALS), new BN(95), new BN(100))

    const gaugeDiff = sub(after.gauge.strategy, before.gauge.strategy)
    const underlyingDiff = sub(after.strategy.totalAssets, before.strategy.totalAssets)

    // underlying transferred from vault to strategy
    assert(eq(after.underlying.vault, sub(before.underlying.vault, amount)), "underlying vault")
    assert(underlyingDiff.gte(minUnderlying), "min underlying")
    assert(gaugeDiff.gte(minC), "min gauge")
  })
})
