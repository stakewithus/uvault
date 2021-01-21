import _setup from "../StrategyYV2/setup"
import { USDC, USDC_WHALE } from "../config"

const StrategyYUsdcV2 = artifacts.require("StrategyYUsdcV2")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyYUsdcV2,
    underlying: USDC,
    whale: USDC_WHALE,
  })
}
