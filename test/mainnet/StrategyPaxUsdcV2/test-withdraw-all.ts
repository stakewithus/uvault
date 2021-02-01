import { USDC_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyPaxV2/create-test-withdraw-all"

test("StrategyPaxUsdcV2", _setup, {
  DECIMALS: USDC_DECIMALS,
})
