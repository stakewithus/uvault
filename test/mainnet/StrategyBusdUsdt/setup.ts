import _setup from "../StrategyCurve/setup"
import { YDAI_YUSDC_YUSDT_YBUSD, BUSD_GAUGE, USDT, USDT_WHALE } from "../config"

const StrategyBusdUsdt = artifacts.require("StrategyBusdUsdt")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyBusdUsdt,
    underlying: USDT,
    lp: YDAI_YUSDC_YUSDT_YBUSD,
    gauge: BUSD_GAUGE,
    whale: USDT_WHALE,
  })
}
