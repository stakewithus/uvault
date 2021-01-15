import { USDC_DECIMALS } from "../../util"
import _setup from "./setup"
import test from "../StrategyAave/create-test-harvest"

test("StrategyAaveUsdc", _setup, {
  DECIMALS: USDC_DECIMALS,
})
