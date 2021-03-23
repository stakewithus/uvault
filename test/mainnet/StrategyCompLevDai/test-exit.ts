import { DAI_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyCompLev/create-test-exit"

test("StrategyCompLevDai", _setup, {
  DECIMALS: DAI_DECIMALS,
})
