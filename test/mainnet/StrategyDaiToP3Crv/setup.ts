import _setup from "../StrategyStableToP3Crv/setup"
import {DAI, DAI_WHALE} from "../config"

const StrategyDaiToP3Crv = artifacts.require("StrategyDaiToP3Crv")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyDaiToP3Crv,
    underlying: DAI,
    whale: DAI_WHALE,
  })
}
