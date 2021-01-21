import _setup from "../Strategy3CrvV2/setup"
import { USDT, USDT_WHALE } from "../config"

const Strategy3CrvUsdtV2 = artifacts.require("Strategy3CrvUsdtV2")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: Strategy3CrvUsdtV2,
    underlying: USDT,
    whale: USDT_WHALE,
  })
}
