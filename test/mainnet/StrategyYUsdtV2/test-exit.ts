import { USDT_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyYV2/create-test-exit"

test("StrategyYUsdtV2", _setup, {
  DECIMALS: USDT_DECIMALS,
})
