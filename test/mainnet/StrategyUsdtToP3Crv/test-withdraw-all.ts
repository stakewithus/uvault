import {USDT_DECIMALS} from "../../util"
import _setup from "./setup"
import test from "../StrategyStableToP3Crv/create-test-withdraw-all"

test("StrategyUsdtToP3Crv", _setup, {
  DECIMALS: USDT_DECIMALS,
})
