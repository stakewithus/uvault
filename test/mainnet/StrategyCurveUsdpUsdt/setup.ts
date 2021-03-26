import _setup from "../StrategyCurveUsdp/setup"
import { USDT, USDT_WHALE } from "../config"

const StrategyCurveUsdpUsdt = artifacts.require("StrategyCurveUsdpUsdt")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyCurveUsdpUsdt,
    underlying: USDT,
    whale: USDT_WHALE,
  })
}
