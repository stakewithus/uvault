import { DAI_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyAave/create-test-skim"

test("StrategyAaveDai", _setup, {
  DECIMALS: DAI_DECIMALS,
})
