import {USDC_DECIMALS} from "../../util"
import _setup from "./setup"
import test from "../StrategyStableToCurve/create-test-exit"

test("StrategyUsdcToCusd", _setup, {
  DECIMALS: USDC_DECIMALS,
})
