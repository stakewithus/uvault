import { DAI_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyPaxV2/create-test-withdraw-all"

test("StrategyPaxDaiV2", _setup, {
  DECIMALS: DAI_DECIMALS,
})
