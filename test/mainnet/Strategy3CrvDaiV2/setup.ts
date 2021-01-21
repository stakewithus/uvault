import _setup from "../Strategy3CrvV2/setup"
import { DAI, DAI_WHALE } from "../config"

const Strategy3CrvDaiV2 = artifacts.require("Strategy3CrvDaiV2")

export default (accounts: Truffle.Accounts) => {
  return _setup(accounts, {
    Strategy: Strategy3CrvDaiV2,
    underlying: DAI,
    whale: DAI_WHALE,
  })
}
