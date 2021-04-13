import { USDT_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyCurveUst/create-test-harvest"

test("StrategyCurveUstUsdt", _setup, {
  DECIMALS: USDT_DECIMALS,
})
