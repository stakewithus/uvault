import { USDC_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyCurveIb/create-test-withdraw"

test("StrategyCurveIbUsdc", _setup, {
  DECIMALS: USDC_DECIMALS,
})
