import { WBTC_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyBbtc/create-test-skim"

test("StrategyBbtcWbtc", _setup, {
  DECIMALS: WBTC_DECIMALS,
})
