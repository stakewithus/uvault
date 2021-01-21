import _setup from "../StrategyYV2/setup"
import { USDT, USDT_WHALE } from "../config"

const StrategyYUsdtV2 = artifacts.require("StrategyYUsdtV2")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyYUsdtV2,
    underlying: USDT,
    whale: USDT_WHALE,
  })
}
