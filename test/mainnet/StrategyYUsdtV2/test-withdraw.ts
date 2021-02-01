import { USDT_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyYV2/create-test-withdraw"

test("StrategyYUsdtV2", _setup, {
  DECIMALS: USDT_DECIMALS,
})
