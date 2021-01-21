import { USDC_DECIMALS } from "../../util"
import _setup from "./setup"
import test from "../StrategyPaxV2/create-test-withdraw"

test("StrategyPaxUsdcV2", _setup, {
  DECIMALS: USDC_DECIMALS,
})
