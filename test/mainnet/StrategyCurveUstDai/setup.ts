import _setup from "../StrategyCurveUst/setup"
import { DAI, DAI_WHALE } from "../config"

const StrategyCurveUstDai = artifacts.require("StrategyCurveUstDai")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyCurveUstDai,
    underlying: DAI,
    whale: DAI_WHALE,
  })
}
