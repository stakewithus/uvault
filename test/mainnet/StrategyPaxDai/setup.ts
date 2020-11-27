import _setup from "../StrategyCurve/setup"
import { DAI_USDC_USDT_PAX, PAX_GAUGE, DAI, DAI_WHALE } from "../config"

const StrategyPaxDai = artifacts.require("StrategyPaxDai")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyPaxDai,
    underlying: DAI,
    lp: DAI_USDC_USDT_PAX,
    gauge: PAX_GAUGE,
    whale: DAI_WHALE,
  })
}
