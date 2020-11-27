import _setup from "../StrategyCurve/setup"
import { DAI_USDC_USDT_PAX, PAX_GAUGE, USDC, USDC_WHALE } from "../config"

const StrategyPaxUsdc = artifacts.require("StrategyPaxUsdc")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyPaxUsdc,
    underlying: USDC,
    lp: DAI_USDC_USDT_PAX,
    gauge: PAX_GAUGE,
    whale: USDC_WHALE,
  })
}
