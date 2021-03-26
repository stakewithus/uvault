import { DAI_DECIMALS, DAI_TO_CURVE_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyCurveUsdp/create-test-deposit"

test("StrategyCurveUsdpDai", _setup, {
  DECIMALS: DAI_DECIMALS,
  UNDERLYING_TO_CURVE_DECIMALS: DAI_TO_CURVE_DECIMALS,
})
