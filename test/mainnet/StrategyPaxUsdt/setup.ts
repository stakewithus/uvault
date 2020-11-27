import _setup from "../StrategyCurve/setup"
import { DAI_USDC_USDT_PAX, PAX_GAUGE, USDT, USDT_WHALE } from "../config"

const StrategyPaxUsdt = artifacts.require("StrategyPaxUsdt")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyPaxUsdt,
    underlying: USDT,
    lp: DAI_USDC_USDT_PAX,
    gauge: PAX_GAUGE,
    whale: USDT_WHALE,
  })
}
