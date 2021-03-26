import { USDC_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyCurveUsdp/create-test-withdraw-all"

test("StrategyCurveUsdpUsdc", _setup, {
  DECIMALS: USDC_DECIMALS,
})
