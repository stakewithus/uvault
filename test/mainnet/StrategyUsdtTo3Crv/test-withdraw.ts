import {USDT_DECIMALS} from "../../util"
import _setup from "./setup"
import test from "../StrategyStableToCurve/create-test-withdraw"

test("StrategyUsdtTo3Crv", _setup, {
  DECIMALS: USDT_DECIMALS,
})