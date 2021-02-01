import { DAI_DECIMALS, DAI_TO_CURVE_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyAave/create-test-deposit"

test("StrategyAaveDai", _setup, {
  DECIMALS: DAI_DECIMALS,
  UNDERLYING_TO_CURVE_DECIMALS: DAI_TO_CURVE_DECIMALS,
})
