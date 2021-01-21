import { USDT_DECIMALS, USDT_TO_CURVE_DECIMALS } from "../../util"
import _setup from "./setup"
import test from "../StrategyPaxV2/create-test-deposit"

test("StrategyPaxUsdtV2", _setup, {
  DECIMALS: USDT_DECIMALS,
  UNDERLYING_TO_CURVE_DECIMALS: USDT_TO_CURVE_DECIMALS,
})
