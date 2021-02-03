import _setup from "../StrategyGusdV2/setup"
import { GUSD, GUSD_WHALE } from "../config"

const StrategyGusdGusdV2 = artifacts.require("StrategyGusdGusdV2")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyGusdGusdV2,
    underlying: GUSD,
    whale: GUSD_WHALE,
  })
}
