import _setup from "../StrategyCurve/setup"
import { YDAI_YUSDC_YUSDT_YBUSD, BUSD_GAUGE, DAI, DAI_WHALE } from "../config"

const StrategyBusdDai = artifacts.require("StrategyBusdDai")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyBusdDai,
    underlying: DAI,
    lp: YDAI_YUSDC_YUSDT_YBUSD,
    gauge: BUSD_GAUGE,
    whale: DAI_WHALE,
  })
}
