import { DAI_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyBusdV2/create-test-withdraw-all"

test("StrategyBusdDaiV2", _setup, {
  DECIMALS: DAI_DECIMALS,
})
