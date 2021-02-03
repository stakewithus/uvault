import { GUSD_DECIMALS, GUSD_TO_CURVE_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyGusdV2/create-test-deposit"

test("StrategyGusdGusdV2", _setup, {
  DECIMALS: GUSD_DECIMALS,
  UNDERLYING_TO_CURVE_DECIMALS: GUSD_TO_CURVE_DECIMALS,
})
