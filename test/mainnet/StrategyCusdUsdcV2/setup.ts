import _setup from "../StrategyCusdV2/setup"
import { USDC, USDC_WHALE } from "../config"

const StrategyCusdUsdcV2 = artifacts.require("StrategyCusdUsdcV2")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyCusdUsdcV2,
    underlying: USDC,
    whale: USDC_WHALE,
  })
}
