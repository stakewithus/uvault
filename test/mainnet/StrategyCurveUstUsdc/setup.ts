import _setup from "../StrategyCurveUst/setup"
import { USDC, USDC_WHALE } from "../config"

const StrategyCurveUstUsdc = artifacts.require("StrategyCurveUstUsdc")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyCurveUstUsdc,
    underlying: USDC,
    whale: USDC_WHALE,
  })
}
