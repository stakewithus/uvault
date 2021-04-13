import _setup from "../StrategyCurveIb/setup"
import { USDT, USDT_WHALE } from "../config"

const StrategyCurveIbUsdt = artifacts.require("StrategyCurveIbUsdt")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyCurveIbUsdt,
    underlying: USDT,
    whale: USDT_WHALE,
  })
}
