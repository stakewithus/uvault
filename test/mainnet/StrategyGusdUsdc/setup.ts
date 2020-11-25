import _setup from "../StrategyCurve/setup"
import { GUSD_3CRV, GUSD_GAUGE, USDC, USDC_WHALE } from "../config"

const StrategyGusdUsdc = artifacts.require("StrategyGusdUsdc")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyGusdUsdc,
    underlying: USDC,
    lp: GUSD_3CRV,
    gauge: GUSD_GAUGE,
    whale: USDC_WHALE,
  })
}
