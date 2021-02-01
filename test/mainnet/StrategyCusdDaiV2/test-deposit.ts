import { DAI_DECIMALS, DAI_TO_CURVE_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyCusdV2/create-test-deposit"

test("StrategyCusdDaiV2", _setup, {
  DECIMALS: DAI_DECIMALS,
  UNDERLYING_TO_CURVE_DECIMALS: DAI_TO_CURVE_DECIMALS,
})
