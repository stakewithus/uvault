import _setup from "../StrategyCurve/setup"
import { THREE_CRV, THREE_GAUGE, USDT, USDT_WHALE } from "../config"

const Strategy3CrvUsdt = artifacts.require("Strategy3CrvUsdt")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: Strategy3CrvUsdt,
    underlying: USDT,
    lp: THREE_CRV,
    gauge: THREE_GAUGE,
    whale: USDT_WHALE,
  })
}
