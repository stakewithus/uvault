import _setup from "../StrategyCurve/setup"
import { YDAI_YUSDC_YUSDT_YTUSD, Y_GAUGE, DAI, DAI_WHALE } from "../config"

const StrategyYDai = artifacts.require("StrategyYDai")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyYDai,
    underlying: DAI,
    lp: YDAI_YUSDC_YUSDT_YTUSD,
    gauge: Y_GAUGE,
    whale: DAI_WHALE,
  })
}
