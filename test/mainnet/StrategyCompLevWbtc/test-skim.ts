import { WBTC_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyCompLev/create-test-skim"

test("StrategyCompLevWbtc", _setup, {
  DECIMALS: WBTC_DECIMALS,
})