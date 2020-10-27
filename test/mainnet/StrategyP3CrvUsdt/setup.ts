import _setup from "../StrategyP3Crv/setup"
import {USDT, USDT_WHALE} from "../config"

const StrategyP3CrvUsdt = artifacts.require("StrategyP3CrvUsdt")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyP3CrvUsdt,
    underlying: USDT,
    whale: USDT_WHALE,
  })
}
