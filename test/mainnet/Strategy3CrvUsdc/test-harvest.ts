import {USDC_DECIMALS} from "../../util"
import _setup from "./setup"
import test from "../StrategyCurve/create-test-harvest"

test("Strategy3CrvUsdc", _setup, {
  DECIMALS: USDC_DECIMALS,
})
