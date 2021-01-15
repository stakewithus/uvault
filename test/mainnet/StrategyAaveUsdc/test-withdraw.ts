import { USDC_DECIMALS } from "../../util"
import _setup from "./setup"
import test from "../StrategyAave/create-test-withdraw"

test("StrategyAaveUsdc", _setup, {
  DECIMALS: USDC_DECIMALS,
})
