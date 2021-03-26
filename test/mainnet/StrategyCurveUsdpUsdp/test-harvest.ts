import { USDP_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyCurveUsdp/create-test-harvest"

test("StrategyCurveUsdpUsdp", _setup, {
  DECIMALS: USDP_DECIMALS,
})
