import _setup from "../StrategyGusdV2/setup"
import { DAI, DAI_WHALE } from "../config"

const StrategyGusdDaiV2 = artifacts.require("StrategyGusdDaiV2")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyGusdDaiV2,
    underlying: DAI,
    whale: DAI_WHALE,
  })
}
