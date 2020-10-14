import _setup from "../StrategyStableToCurve/setup"
import {THREE_CRV, THREE_GAUGE, USDT, USDT_WHALE} from "../config"

const StrategyUsdtTo3Crv = artifacts.require("StrategyUsdtTo3Crv")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyUsdtTo3Crv,
    underlying: USDT,
    cUnderlying: THREE_CRV,
    gauge: THREE_GAUGE,
    whale: USDT_WHALE
  })
}
