import _setup from "../StrategyCurveUst/setup"
import { USDT, USDT_WHALE } from "../config"

const StrategyCurveUstUsdt = artifacts.require("StrategyCurveUstUsdt")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyCurveUstUsdt,
    underlying: USDT,
    whale: USDT_WHALE,
  })
}
