import { DAI_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyCurveUsdp/create-test-exit"

test("StrategyCurveUsdpDai", _setup, {
  DECIMALS: DAI_DECIMALS,
})
