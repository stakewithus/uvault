import _setup from "../StrategyCurve/setup"
import { YDAI_YUSDC_YUSDT_YTUSD, Y_GAUGE, USDT, USDT_WHALE } from "../config"

const StrategyYUsdt = artifacts.require("StrategyYUsdt")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyYUsdt,
    underlying: USDT,
    lp: YDAI_YUSDC_YUSDT_YTUSD,
    gauge: Y_GAUGE,
    whale: USDT_WHALE,
  })
}
