const setup = require("../StrategyStableToCurve/setup")
const {CUSD, CGAUGE, DAI, DAI_WHALE} = require("../../config")
const StrategyDaiToCusdMainnet = artifacts.require("StrategyDaiToCusdMainnet")

module.exports = (accounts) => {
  return setup(accounts, {
    Strategy: StrategyDaiToCusdMainnet,
    underlying: DAI,
    cUnderlying: CUSD,
    gauge: CGAUGE,
    whale: DAI_WHALE
  })
}
