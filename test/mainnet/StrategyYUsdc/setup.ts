import _setup from "../StrategyCurve/setup"
import { YDAI_YUSDC_YUSDT_YTUSD, Y_GAUGE, USDC, USDC_WHALE } from "../config"

const StrategyYUsdc = artifacts.require("StrategyYUsdc")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyYUsdc,
    underlying: USDC,
    lp: YDAI_YUSDC_YUSDT_YTUSD,
    gauge: Y_GAUGE,
    whale: USDC_WHALE,
  })
}
