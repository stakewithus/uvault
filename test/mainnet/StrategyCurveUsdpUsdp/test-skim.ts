import { USDP_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyCurveUsdp/create-test-skim"

test("StrategyCurveUsdpUsdp", _setup, {
  DECIMALS: USDP_DECIMALS,
})
