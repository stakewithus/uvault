import { DAI_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyGusdV2/create-test-skim"

test("StrategyGusdDaiV2", _setup, {
  DECIMALS: DAI_DECIMALS,
})
