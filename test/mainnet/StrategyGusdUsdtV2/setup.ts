import _setup from "../StrategyGusdV2/setup"
import { USDT, USDT_WHALE } from "../config"

const StrategyGusdUsdtV2 = artifacts.require("StrategyGusdUsdtV2")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyGusdUsdtV2,
    underlying: USDT,
    whale: USDT_WHALE,
  })
}
