import _setup from "../StrategyCurve/setup"
import { YDAI_YUSDC_YUSDT_YBUSD, BUSD_GAUGE, USDC, USDC_WHALE } from "../config"

const StrategyBusdUsdc = artifacts.require("StrategyBusdUsdc")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyBusdUsdc,
    underlying: USDC,
    lp: YDAI_YUSDC_YUSDT_YBUSD,
    gauge: BUSD_GAUGE,
    whale: USDC_WHALE,
  })
}
