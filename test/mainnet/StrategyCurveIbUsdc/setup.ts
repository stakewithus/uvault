import _setup from "../StrategyCurveIb/setup"
import { USDC, USDC_WHALE } from "../config"

const StrategyCurveIbUsdc = artifacts.require("StrategyCurveIbUsdc")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyCurveIbUsdc,
    underlying: USDC,
    whale: USDC_WHALE,
  })
}
