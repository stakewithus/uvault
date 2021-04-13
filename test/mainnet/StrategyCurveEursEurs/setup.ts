import _setup from "../StrategyCurveEurs/setup"
import { EURS, EURS_WHALE } from "../config"

const StrategyCurveEursEurs = artifacts.require("StrategyCurveEursEurs")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyCurveEursEurs,
    underlying: EURS,
    whale: EURS_WHALE,
  })
}
