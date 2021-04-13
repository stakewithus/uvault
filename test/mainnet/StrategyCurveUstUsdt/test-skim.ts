import { USDT_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyCurveUst/create-test-skim"

test("StrategyCurveUstUsdt", _setup, {
  DECIMALS: USDT_DECIMALS,
})
