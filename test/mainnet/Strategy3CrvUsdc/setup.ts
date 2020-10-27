import _setup from "../StrategyCurve/setup"
import {THREE_CRV, THREE_GAUGE, USDC, USDC_WHALE} from "../config"

const Strategy3CrvUsdc = artifacts.require("Strategy3CrvUsdc")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: Strategy3CrvUsdc,
    underlying: USDC,
    cUnderlying: THREE_CRV,
    gauge: THREE_GAUGE,
    whale: USDC_WHALE,
  })
}
