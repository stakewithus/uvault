import _setup from "../StrategyCurve/setup"
import { DAI_USDC_USDT_AAVE, AAVE_GAUGE, DAI, DAI_WHALE } from "../config"

const StrategyAaveDai = artifacts.require("StrategyAaveDai")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyAaveDai,
    underlying: DAI,
    lp: DAI_USDC_USDT_AAVE,
    gauge: AAVE_GAUGE,
    whale: DAI_WHALE,
  })
}
