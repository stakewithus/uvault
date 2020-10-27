import {USDC_DECIMALS} from "../../util"
import _setup from "./setup"
import test from "../StrategyP3Crv/create-test-withdraw"

test("StrategyP3CrvUsdc", _setup, {
  DECIMALS: USDC_DECIMALS,
})
