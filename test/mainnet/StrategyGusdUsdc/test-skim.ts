import { USDC_DECIMALS } from "../../util"
import _setup from "./setup"
import test from "../StrategyCurve/create-test-skim"

test("StrategyGusdUsdc", _setup, {
  DECIMALS: USDC_DECIMALS,
})
