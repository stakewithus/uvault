import { USDC_DECIMALS } from "../../util"
import _setup from "./setup"
import test from "../StrategyGusdV2/create-test-harvest"

test("StrategyGusdUsdcV2", _setup, {
  DECIMALS: USDC_DECIMALS,
})
