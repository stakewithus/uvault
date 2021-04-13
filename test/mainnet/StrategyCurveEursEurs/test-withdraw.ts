import { EURS_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyCurveEurs/create-test-withdraw"

test("StrategyCurveEursEurs", _setup, {
  DECIMALS: EURS_DECIMALS,
})
