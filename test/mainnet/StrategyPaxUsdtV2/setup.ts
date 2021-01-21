import _setup from "../StrategyPaxV2/setup"
import { USDT, USDT_WHALE } from "../config"

const StrategyPaxUsdtV2 = artifacts.require("StrategyPaxUsdtV2")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyPaxUsdtV2,
    underlying: USDT,
    whale: USDT_WHALE,
  })
}
