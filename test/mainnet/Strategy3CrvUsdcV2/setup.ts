import _setup from "../Strategy3CrvV2/setup"
import { USDC, USDC_WHALE } from "../config"

const Strategy3CrvUsdcV2 = artifacts.require("Strategy3CrvUsdcV2")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: Strategy3CrvUsdcV2,
    underlying: USDC,
    whale: USDC_WHALE,
  })
}
