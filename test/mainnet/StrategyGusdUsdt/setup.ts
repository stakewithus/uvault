import _setup from "../StrategyCurve/setup"
import { GUSD_3CRV, GUSD_GAUGE, USDT, USDT_WHALE } from "../config"

const StrategyGusdUsdt = artifacts.require("StrategyGusdUsdt")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyGusdUsdt,
    underlying: USDT,
    lp: GUSD_3CRV,
    gauge: GUSD_GAUGE,
    whale: USDT_WHALE,
  })
}
