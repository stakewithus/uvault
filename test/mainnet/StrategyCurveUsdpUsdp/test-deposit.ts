import { USDP_DECIMALS, USDP_TO_CURVE_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyCurveUsdp/create-test-deposit"

test("StrategyCurveUsdpUsdp", _setup, {
  DECIMALS: USDP_DECIMALS,
  UNDERLYING_TO_CURVE_DECIMALS: USDP_TO_CURVE_DECIMALS,
})
