import _setup from "../StrategyCurveUsdp/setup"
import { USDC, USDC_WHALE } from "../config"

const StrategyCurveUsdpUsdc = artifacts.require("StrategyCurveUsdpUsdc")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyCurveUsdpUsdc,
    underlying: USDC,
    whale: USDC_WHALE,
  })
}
