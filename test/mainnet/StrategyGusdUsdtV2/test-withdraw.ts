import { USDT_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyGusdV2/create-test-withdraw"

test("StrategyGusdUsdtV2", _setup, {
  DECIMALS: USDT_DECIMALS,
})
