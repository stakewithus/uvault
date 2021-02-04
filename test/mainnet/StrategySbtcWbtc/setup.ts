import _setup from "../StrategySbtc/setup"
import { WBTC, WBTC_WHALE } from "../config"

const StrategySbtcWbtc = artifacts.require("StrategySbtcWbtc")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategySbtcWbtc,
    underlying: WBTC,
    whale: WBTC_WHALE,
  })
}
