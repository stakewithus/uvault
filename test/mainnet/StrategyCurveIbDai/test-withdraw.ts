import { DAI_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyCurveIb/create-test-withdraw"

test("StrategyCurveIbDai", _setup, {
  DECIMALS: DAI_DECIMALS,
})
