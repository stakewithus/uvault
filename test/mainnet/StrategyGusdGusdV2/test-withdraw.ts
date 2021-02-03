import { GUSD_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyGusdV2/create-test-withdraw"

test("StrategyGusdGusdV2", _setup, {
  DECIMALS: GUSD_DECIMALS,
})
