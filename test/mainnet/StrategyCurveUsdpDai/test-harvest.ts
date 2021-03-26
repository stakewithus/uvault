import { DAI_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyCurveUsdp/create-test-harvest"

test("StrategyCurveUsdpDai", _setup, {
  DECIMALS: DAI_DECIMALS,
})
