import { DAI_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyYV2/create-test-exit"

test("StrategyYDaiV2", _setup, {
  DECIMALS: DAI_DECIMALS,
})
