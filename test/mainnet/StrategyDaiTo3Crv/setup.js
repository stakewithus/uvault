const setup = require("../StrategyStableToCurve/setup")
const {THREE_CRV, THREE_GAUGE, DAI, DAI_WHALE} = require("../../config")
const StrategyDaiTo3Crv = artifacts.require("StrategyDaiTo3Crv")

module.exports = (accounts) => {
  return setup(accounts, {
    Strategy: StrategyDaiTo3Crv,
    underlying: DAI,
    cUnderlying: THREE_CRV,
    gauge: THREE_GAUGE,
    whale: DAI_WHALE
  })
}
