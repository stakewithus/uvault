import { USDC_DECIMALS } from "../../util"
import _setup from "./setup"
import test from "../StrategyYV2/create-test-harvest"

test("StrategyYUsdcV2", _setup, {
  DECIMALS: USDC_DECIMALS,
})
