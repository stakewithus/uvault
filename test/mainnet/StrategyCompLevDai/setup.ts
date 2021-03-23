import _setup from "../StrategyCompLev/setup"
import { DAI, CDAI, DAI_WHALE } from "../config"

const StrategyCompLevDai = artifacts.require("StrategyCompLevDai")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyCompLevDai,
    underlying: DAI,
    cToken: CDAI,
    whale: DAI_WHALE,
  })
}
