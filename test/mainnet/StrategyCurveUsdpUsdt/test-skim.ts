import { USDT_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyCurveUsdp/create-test-skim"

test("StrategyCurveUsdpUsdt", _setup, {
  DECIMALS: USDT_DECIMALS,
})
