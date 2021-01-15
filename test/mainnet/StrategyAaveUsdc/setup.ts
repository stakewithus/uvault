import _setup from "../StrategyAave/setup"
import { USDC, USDC_WHALE } from "../config"

const StrategyAaveUsdc = artifacts.require("StrategyAaveUsdc")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyAaveUsdc,
    underlying: USDC,
    whale: USDC_WHALE,
  })
}
