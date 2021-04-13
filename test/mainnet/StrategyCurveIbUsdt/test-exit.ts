import { USDT_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyCurveIb/create-test-exit"

test("StrategyCurveIbUsdt", _setup, {
  DECIMALS: USDT_DECIMALS,
})
