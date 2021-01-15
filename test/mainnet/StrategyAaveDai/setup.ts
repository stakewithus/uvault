import _setup from "../StrategyAave/setup"
import { DAI, DAI_WHALE } from "../config"

const StrategyAaveDai = artifacts.require("StrategyAaveDai")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyAaveDai,
    underlying: DAI,
    whale: DAI_WHALE,
  })
}
