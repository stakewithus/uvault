import { USDT_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyCurveUsdp/create-test-harvest"

test("StrategyCurveUsdpUsdt", _setup, {
  DECIMALS: USDT_DECIMALS,
})
