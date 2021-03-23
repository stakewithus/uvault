import { DAI_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyCompLev/create-test-deleverage"

test("StrategyCompLevDai", _setup, {
  DECIMALS: DAI_DECIMALS,
})
