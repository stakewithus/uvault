import { USDP_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyCurveUsdp/create-test-withdraw-all"

test("StrategyCurveUsdpUsdp", _setup, {
  DECIMALS: USDP_DECIMALS,
})
