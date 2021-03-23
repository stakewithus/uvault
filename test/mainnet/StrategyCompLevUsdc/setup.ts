import _setup from "../StrategyCompLev/setup"
import { USDC, CUSDC, USDC_WHALE } from "../config"

const StrategyCompLevUsdc = artifacts.require("StrategyCompLevUsdc")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyCompLevUsdc,
    underlying: USDC,
    cToken: CUSDC,
    whale: USDC_WHALE,
  })
}
