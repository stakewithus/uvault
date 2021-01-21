import _setup from "../StrategyGusdV2/setup"
import { USDC, USDC_WHALE } from "../config"

const StrategyGusdUsdcV2 = artifacts.require("StrategyGusdUsdcV2")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyGusdUsdcV2,
    underlying: USDC,
    whale: USDC_WHALE,
  })
}
