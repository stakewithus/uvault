import _setup from "../StrategyPaxV2/setup"
import { DAI, DAI_WHALE } from "../config"

const StrategyPaxDaiV2 = artifacts.require("StrategyPaxDaiV2")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyPaxDaiV2,
    underlying: DAI,
    whale: DAI_WHALE,
  })
}
