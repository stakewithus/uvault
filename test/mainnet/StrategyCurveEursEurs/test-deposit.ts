import { EURS_DECIMALS, EURS_TO_CURVE_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyCurveEurs/create-test-deposit"

test("StrategyCurveEursEurs", _setup, {
  DECIMALS: EURS_DECIMALS,
  UNDERLYING_TO_CURVE_DECIMALS: EURS_TO_CURVE_DECIMALS,
})
