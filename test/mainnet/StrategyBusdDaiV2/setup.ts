import _setup from "../StrategyBusdV2/setup"
import { DAI, DAI_WHALE } from "../config"

const StrategyBusdDaiV2 = artifacts.require("StrategyBusdDaiV2")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyBusdDaiV2,
    underlying: DAI,
    whale: DAI_WHALE,
  })
}
