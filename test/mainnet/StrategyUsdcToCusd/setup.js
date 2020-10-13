const setup = require("../StrategyStableToCurve/setup")
const {CUSD, CGAUGE, USDC, USDC_WHALE} = require("../../config")
const StrategyUsdcToCusd = artifacts.require("StrategyUsdcToCusd")

module.exports = (accounts) => {
  return setup(accounts, {
    Strategy: StrategyUsdcToCusd,
    underlying: USDC,
    cUnderlying: CUSD,
    gauge: CGAUGE,
    whale: USDC_WHALE
  })
}
