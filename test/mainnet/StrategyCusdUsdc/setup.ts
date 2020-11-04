import _setup from "../StrategyCurve/setup"
import { CUSD, CGAUGE, USDC, USDC_WHALE } from "../config"

const StrategyCusdUsdc = artifacts.require("StrategyCusdUsdc")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyCusdUsdc,
    underlying: USDC,
    lp: CUSD,
    gauge: CGAUGE,
    whale: USDC_WHALE,
  })
}
