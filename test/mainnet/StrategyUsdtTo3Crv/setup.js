const setup = require("../StrategyStableToCurve/setup")
const {THREE_CRV, THREE_GAUGE, USDT, USDT_WHALE} = require("../../config")
const StrategyUsdtTo3Crv = artifacts.require("StrategyUsdtTo3Crv")

module.exports = (accounts) => {
  return setup(accounts, {
    Strategy: StrategyUsdtTo3Crv,
    underlying: USDT,
    cUnderlying: THREE_CRV,
    gauge: THREE_GAUGE,
    whale: USDT_WHALE
  })
}
