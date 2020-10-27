import _setup from "../StrategyStableToP3Crv/setup"
import {USDC, USDC_WHALE} from "../config"

const StrategyUsdcToP3Crv = artifacts.require("StrategyUsdcToP3Crv")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyUsdcToP3Crv,
    underlying: USDC,
    whale: USDC_WHALE,
  })
}
