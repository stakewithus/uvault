import _setup from "../StrategyCurve/setup"
import { CUSD, CGAUGE, DAI, DAI_WHALE } from "../config"

const StrategyCusdDai = artifacts.require("StrategyCusdDai")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyCusdDai,
    underlying: DAI,
    lp: CUSD,
    gauge: CGAUGE,
    whale: DAI_WHALE,
  })
}
