import _setup from "../StrategyAave/setup"
import { USDT, USDT_WHALE } from "../config"

const StrategyAaveUsdt = artifacts.require("StrategyAaveUsdt")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyAaveUsdt,
    underlying: USDT,
    whale: USDT_WHALE,
  })
}
