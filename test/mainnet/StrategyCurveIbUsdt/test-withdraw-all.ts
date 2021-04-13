import { USDT_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyCurveIb/create-test-withdraw-all"

test("StrategyCurveIbUsdt", _setup, {
  DECIMALS: USDT_DECIMALS,
})
