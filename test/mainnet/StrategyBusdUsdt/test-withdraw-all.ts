import { USDT_DECIMALS } from "../../util"
import _setup from "./setup"
import test from "../StrategyCurve/create-test-withdraw-all"

test("StrategyBusdUsdt", _setup, {
  DECIMALS: USDT_DECIMALS,
})
