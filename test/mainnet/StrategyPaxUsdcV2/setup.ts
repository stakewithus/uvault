import _setup from "../StrategyPaxV2/setup"
import { USDC, USDC_WHALE } from "../config"

const StrategyPaxUsdcV2 = artifacts.require("StrategyPaxUsdcV2")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyPaxUsdcV2,
    underlying: USDC,
    whale: USDC_WHALE,
  })
}
