import { WBTC_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategySbtc/create-test-exit"

test("StrategySbtcWbtc", _setup, {
  DECIMALS: WBTC_DECIMALS,
})
