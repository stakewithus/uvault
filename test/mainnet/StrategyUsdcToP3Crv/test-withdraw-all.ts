import {USDC_DECIMALS} from "../../util"
import _setup from "./setup"
import test from "../StrategyStableToP3Crv/create-test-withdraw-all"

test("StrategyUsdcToP3Crv", _setup, {
  DECIMALS: USDC_DECIMALS,
})
