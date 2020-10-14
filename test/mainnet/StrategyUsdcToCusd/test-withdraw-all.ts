import {USDC_DECIMALS} from "../../util"
import _setup from "./setup"
import test from "../StrategyStableToCurve/create-test-withdraw-all"

test("StrategyUsdcToCusd", _setup, {
  DECIMALS: USDC_DECIMALS,
})
