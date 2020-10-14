import _setup from "../StrategyStableToCurve/setup"
import {THREE_CRV, THREE_GAUGE, DAI, DAI_WHALE} from "../config"

const StrategyDaiTo3Crv = artifacts.require("StrategyDaiTo3Crv")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyDaiTo3Crv,
    underlying: DAI,
    cUnderlying: THREE_CRV,
    gauge: THREE_GAUGE,
    whale: DAI_WHALE,
  })
}
