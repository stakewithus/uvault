import { USDC_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyBusdV2/create-test-withdraw-all"

test("StrategyBusdUsdcV2", _setup, {
  DECIMALS: USDC_DECIMALS,
})
