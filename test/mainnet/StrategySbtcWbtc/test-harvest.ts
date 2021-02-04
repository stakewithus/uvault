import { WBTC_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategySbtc/create-test-harvest"

test("StrategySbtcWbtc", _setup, {
  DECIMALS: WBTC_DECIMALS,
})
