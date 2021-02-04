import _setup from "../StrategyBbtc/setup"
import { WBTC, WBTC_WHALE } from "../config"

const StrategyBbtcWbtc = artifacts.require("StrategyBbtcWbtc")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyBbtcWbtc,
    underlying: WBTC,
    whale: WBTC_WHALE,
  })
}
