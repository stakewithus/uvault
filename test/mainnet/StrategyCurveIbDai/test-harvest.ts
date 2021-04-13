import { DAI_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyCurveIb/create-test-harvest"

test("StrategyCurveIbDai", _setup, {
  DECIMALS: DAI_DECIMALS,
})
