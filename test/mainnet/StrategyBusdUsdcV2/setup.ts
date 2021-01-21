import _setup from "../StrategyBusdV2/setup"
import { USDC, USDC_WHALE } from "../config"

const StrategyBusdUsdcV2 = artifacts.require("StrategyBusdUsdcV2")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyBusdUsdcV2,
    underlying: USDC,
    whale: USDC_WHALE,
  })
}
