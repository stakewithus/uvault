import { USDT_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyBusdV2/create-test-harvest"

test("StrategyBusdUsdtV2", _setup, {
  DECIMALS: USDT_DECIMALS,
})
