import { USDC_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyCurveUsdp/create-test-exit"

test("StrategyCurveUsdpUsdc", _setup, {
  DECIMALS: USDC_DECIMALS,
})
