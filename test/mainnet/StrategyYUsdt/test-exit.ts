import { USDT_DECIMALS } from "../../util"
import _setup from "./setup"
import test from "../StrategyCurve/create-test-exit"

test("StrategyYUsdt", _setup, {
  DECIMALS: USDT_DECIMALS,
})
