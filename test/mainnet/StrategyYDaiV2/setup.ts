import _setup from "../StrategyYV2/setup"
import { DAI, DAI_WHALE } from "../config"

const StrategyYDaiV2 = artifacts.require("StrategyYDaiV2")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyYDaiV2,
    underlying: DAI,
    whale: DAI_WHALE,
  })
}
