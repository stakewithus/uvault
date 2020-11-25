import _setup from "../StrategyCurve/setup"
import { GUSD_3CRV, GUSD_GAUGE, DAI, DAI_WHALE } from "../config"

const StrategyGusdDai = artifacts.require("StrategyGusdDai")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyGusdDai,
    underlying: DAI,
    lp: GUSD_3CRV,
    gauge: GUSD_GAUGE,
    whale: DAI_WHALE,
  })
}
