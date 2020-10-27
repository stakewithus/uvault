import _setup from "../StrategyStableToP3Crv/setup"
import {USDT, USDT_WHALE} from "../config"

const StrategyUsdtToP3Crv = artifacts.require("StrategyUsdtToP3Crv")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyUsdtToP3Crv,
    underlying: USDT,
    whale: USDT_WHALE,
  })
}
