import { WBTC_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyCompLev/create-test-withdraw-all"

test("StrategyCompLevWbtc", _setup, {
  DECIMALS: WBTC_DECIMALS,
})
