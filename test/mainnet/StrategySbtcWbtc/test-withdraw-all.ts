import { WBTC_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategySbtc/create-test-withdraw-all"

test("StrategySbtcWbtc", _setup, {
  DECIMALS: WBTC_DECIMALS,
})
