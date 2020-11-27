import { USDT_DECIMALS, USDT_TO_CURVE_DECIMALS } from "../../util"
import _setup from "./setup"
import test from "../StrategyCurve/create-test-deposit"

test("StrategyPaxUsdt", _setup, {
  DECIMALS: USDT_DECIMALS,
  UNDERLYING_TO_CURVE_DECIMALS: USDT_TO_CURVE_DECIMALS,
})
