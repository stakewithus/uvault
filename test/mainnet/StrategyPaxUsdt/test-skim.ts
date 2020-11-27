import { USDT_DECIMALS } from "../../util"
import _setup from "./setup"
import test from "../StrategyCurve/create-test-skim"

test("StrategyPaxUsdt", _setup, {
  DECIMALS: USDT_DECIMALS,
})
