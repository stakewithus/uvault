import _setup from "../StrategyP3Crv/setup"
import {DAI, DAI_WHALE} from "../config"

const StrategyP3CrvDai = artifacts.require("StrategyP3CrvDai")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyP3CrvDai,
    underlying: DAI,
    whale: DAI_WHALE,
  })
}
