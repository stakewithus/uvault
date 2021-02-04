import _setup from "../StrategyObtc/setup"
import { WBTC, WBTC_WHALE } from "../config"

const StrategyObtcWbtc = artifacts.require("StrategyObtcWbtc")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyObtcWbtc,
    underlying: WBTC,
    whale: WBTC_WHALE,
  })
}
