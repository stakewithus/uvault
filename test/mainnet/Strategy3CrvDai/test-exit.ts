import {DAI_DECIMALS} from "../../util"
import _setup from "./setup"
import test from "../StrategyCurve/create-test-exit"

test("Strategy3CrvDai", _setup, {
  DECIMALS: DAI_DECIMALS,
})