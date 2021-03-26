import _setup from "../StrategyCurveUsdp/setup"
import { USDP, USDP_WHALE } from "../config"

const StrategyCurveUsdpUsdp = artifacts.require("StrategyCurveUsdpUsdp")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyCurveUsdpUsdp,
    underlying: USDP,
    whale: USDP_WHALE,
  })
}
