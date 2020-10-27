import _setup from "../StrategyP3Crv/setup"
import {USDC, USDC_WHALE} from "../config"

const StrategyP3CrvUsdc = artifacts.require("StrategyP3CrvUsdc")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyP3CrvUsdc,
    underlying: USDC,
    whale: USDC_WHALE,
  })
}
