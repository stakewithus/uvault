import { USDC_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyCompLev/create-test-withdraw-all"

test("StrategyCompLevUsdc", _setup, {
  DECIMALS: USDC_DECIMALS,
})
