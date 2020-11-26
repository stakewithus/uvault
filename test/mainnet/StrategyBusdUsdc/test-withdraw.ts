import { USDC_DECIMALS } from "../../util"
import _setup from "./setup"
import test from "../StrategyCurve/create-test-withdraw"

test("StrategyBusdUsdc", _setup, {
  DECIMALS: USDC_DECIMALS,
})
