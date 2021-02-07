import _setup from "../StrategyBusdV2/setup"
import { BUSD, BUSD_WHALE } from "../config"

const StrategyBusdBusdV2 = artifacts.require("StrategyBusdBusdV2")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyBusdBusdV2,
    underlying: BUSD,
    whale: BUSD_WHALE,
  })
}
