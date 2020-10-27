import {DAI_DECIMALS} from "../../util"
import _setup from "./setup"
import test from "../StrategyCurve/create-test-exit"

test("StrategyCusdDai", _setup, {
  DECIMALS: DAI_DECIMALS,
})
