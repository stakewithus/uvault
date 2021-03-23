import _setup from "../StrategyCompLev/setup"
import { WBTC, CWBTC, WBTC_WHALE } from "../config"

const StrategyCompLevWbtc = artifacts.require("StrategyCompLevWbtc")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyCompLevWbtc,
    underlying: WBTC,
    cToken: CWBTC,
    whale: WBTC_WHALE,
  })
}
