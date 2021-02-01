import { USDT_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyAave/create-test-withdraw-all"

test("StrategyAaveUsdt", _setup, {
  DECIMALS: USDT_DECIMALS,
})
