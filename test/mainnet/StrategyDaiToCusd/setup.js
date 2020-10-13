const setup = require("../StrategyStableToCurve/setup")
const {CUSD, CGAUGE, DAI, DAI_WHALE} = require("../../config")
const StrategyDaiToCusd = artifacts.require("StrategyDaiToCusd")

module.exports = (accounts) => {
  return setup(accounts, {
    Strategy: StrategyDaiToCusd,
    underlying: DAI,
    cUnderlying: CUSD,
    gauge: CGAUGE,
    whale: DAI_WHALE
  })
}
