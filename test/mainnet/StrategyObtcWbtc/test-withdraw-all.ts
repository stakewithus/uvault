import { WBTC_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyObtc/create-test-withdraw-all"

test("StrategyObtcWbtc", _setup, {
  DECIMALS: WBTC_DECIMALS,
})
