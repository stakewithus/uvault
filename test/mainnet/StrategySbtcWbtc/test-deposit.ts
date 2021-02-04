import { WBTC_DECIMALS, WBTC_TO_CURVE_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategySbtc/create-test-deposit"

test("StrategySbtcWbtc", _setup, {
  DECIMALS: WBTC_DECIMALS,
  UNDERLYING_TO_CURVE_DECIMALS: WBTC_TO_CURVE_DECIMALS,
})
