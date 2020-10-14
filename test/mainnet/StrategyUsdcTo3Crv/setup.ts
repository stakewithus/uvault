import _setup from "../StrategyStableToCurve/setup"
import {THREE_CRV, THREE_GAUGE, USDC, USDC_WHALE} from "../config"

const StrategyUsdcTo3Crv = artifacts.require("StrategyUsdcTo3Crv")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyUsdcTo3Crv,
    underlying: USDC,
    cUnderlying: THREE_CRV,
    gauge: THREE_GAUGE,
    whale: USDC_WHALE
  })
}
