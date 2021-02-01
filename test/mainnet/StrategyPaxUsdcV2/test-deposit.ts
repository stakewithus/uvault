import { USDC_DECIMALS, USDC_TO_CURVE_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyPaxV2/create-test-deposit"

test("StrategyPaxUsdcV2", _setup, {
  DECIMALS: USDC_DECIMALS,
  UNDERLYING_TO_CURVE_DECIMALS: USDC_TO_CURVE_DECIMALS,
})
