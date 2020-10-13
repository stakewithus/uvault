const setup = require("../StrategyStableToCurve/setup")
const {THREE_CRV, THREE_GAUGE, USDC, USDC_WHALE} = require("../../config")
const StrategyUsdcTo3Crv = artifacts.require("StrategyUsdcTo3Crv")

module.exports = (accounts) => {
  return setup(accounts, {
    Strategy: StrategyUsdcTo3Crv,
    underlying: USDC,
    cUnderlying: THREE_CRV,
    gauge: THREE_GAUGE,
    whale: USDC_WHALE
  })
}
