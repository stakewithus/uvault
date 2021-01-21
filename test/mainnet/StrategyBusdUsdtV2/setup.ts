import _setup from "../StrategyBusdV2/setup"
import { USDT, USDT_WHALE } from "../config"

const StrategyBusdUsdtV2 = artifacts.require("StrategyBusdUsdtV2")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyBusdUsdtV2,
    underlying: USDT,
    whale: USDT_WHALE,
  })
}
