import { USDC_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyCurveUst/create-test-withdraw-all"

test("StrategyCurveUstUsdc", _setup, {
  DECIMALS: USDC_DECIMALS,
})
