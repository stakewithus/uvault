import _setup from "../StrategyCurve/setup"
import { THREE_CRV, THREE_GAUGE, DAI, DAI_WHALE } from "../config"

const Strategy3CrvDai = artifacts.require("Strategy3CrvDai")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: Strategy3CrvDai,
    underlying: DAI,
    lp: THREE_CRV,
    gauge: THREE_GAUGE,
    whale: DAI_WHALE,
  })
}
