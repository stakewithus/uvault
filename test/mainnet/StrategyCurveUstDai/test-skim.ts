import { DAI_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyCurveUst/create-test-skim"

test("StrategyCurveUstDai", _setup, {
  DECIMALS: DAI_DECIMALS,
})
