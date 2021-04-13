import { USDC_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyCurveIb/create-test-skim"

test("StrategyCurveIbUsdc", _setup, {
  DECIMALS: USDC_DECIMALS,
})
