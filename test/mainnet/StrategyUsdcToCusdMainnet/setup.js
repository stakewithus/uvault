const setup = require("../StrategyStableToCurve/setup")
const {CUSD, CGAUGE, USDC, USDC_WHALE} = require("../../config")
const StrategyUsdcToCusdMainnet = artifacts.require("StrategyUsdcToCusdMainnet")

module.exports = (accounts) => {
  return setup(accounts, {
    Strategy: StrategyUsdcToCusdMainnet,
    underlying: USDC,
    cUnderlying: CUSD,
    gauge: CGAUGE,
    whale: USDC_WHALE
  })
}
