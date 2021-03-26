import { USDP_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyCurveUsdp/create-test-withdraw"

test("StrategyCurveUsdpUsdp", _setup, {
  DECIMALS: USDP_DECIMALS,
})
