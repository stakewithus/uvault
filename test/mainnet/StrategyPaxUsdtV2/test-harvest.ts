import { USDT_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyPaxV2/create-test-harvest"

test("StrategyPaxUsdtV2", _setup, {
  DECIMALS: USDT_DECIMALS,
})
