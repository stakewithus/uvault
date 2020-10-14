import _setup from "../StrategyStableToCurve/setup"
import {CUSD, CGAUGE, DAI, DAI_WHALE} from "../config"

const StrategyDaiToCusd = artifacts.require("StrategyDaiToCusd")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyDaiToCusd,
    underlying: DAI,
    cUnderlying: CUSD,
    gauge: CGAUGE,
    whale: DAI_WHALE,
  })
}
