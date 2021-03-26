import _setup from "../StrategyCurveUsdp/setup"
import { DAI, DAI_WHALE } from "../config"

const StrategyCurveUsdpDai = artifacts.require("StrategyCurveUsdpDai")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyCurveUsdpDai,
    underlying: DAI,
    whale: DAI_WHALE,
  })
}
