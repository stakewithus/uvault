import _setup from "../StrategyCurve/setup"
import { CUSD, CUSD_GAUGE, USDC, USDC_WHALE } from "../config"

const StrategyCusdUsdc = artifacts.require("StrategyCusdUsdc")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyCusdUsdc,
    underlying: USDC,
    lp: CUSD,
    gauge: CUSD_GAUGE,
    whale: USDC_WHALE,
  })
}
