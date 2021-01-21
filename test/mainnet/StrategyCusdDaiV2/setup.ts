import _setup from "../StrategyCusdV2/setup"
import { DAI, DAI_WHALE } from "../config"

const StrategyCusdDaiV2 = artifacts.require("StrategyCusdDaiV2")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: StrategyCusdDaiV2,
    underlying: DAI,
    whale: DAI_WHALE,
  })
}
