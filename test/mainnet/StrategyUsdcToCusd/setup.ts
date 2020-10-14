import _setup from "../StrategyStableToCurve/setup"
import {CUSD, CGAUGE, USDC, USDC_WHALE} from "../config"

const StrategyUsdcToCusd = artifacts.require("StrategyUsdcToCusd")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyUsdcToCusd,
    underlying: USDC,
    cUnderlying: CUSD,
    gauge: CGAUGE,
    whale: USDC_WHALE,
  })
}
