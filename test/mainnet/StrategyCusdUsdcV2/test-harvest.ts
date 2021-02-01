import { USDC_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyCusdV2/create-test-harvest"

test("StrategyCusdUsdcV2", _setup, {
  DECIMALS: USDC_DECIMALS,
})
