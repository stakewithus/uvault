import _setup from "../StrategyCurveIb/setup"
import { DAI, DAI_WHALE } from "../config"

const StrategyCurveIbDai = artifacts.require("StrategyCurveIbDai")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyCurveIbDai,
    underlying: DAI,
    whale: DAI_WHALE,
  })
}
