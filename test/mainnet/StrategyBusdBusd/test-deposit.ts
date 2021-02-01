import { BUSD_DECIMALS, BUSD_TO_CURVE_DECIMALS } from "../../util"
import _setup from "./setup"
import test from "../StrategyBusdV2/create-test-deposit"

test("StrategyBusdBusdV2", _setup, {
  DECIMALS: BUSD_DECIMALS,
  UNDERLYING_TO_CURVE_DECIMALS: BUSD_TO_CURVE_DECIMALS,
})
