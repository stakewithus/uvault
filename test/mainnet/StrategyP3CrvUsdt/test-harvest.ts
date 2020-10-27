import {USDT_DECIMALS} from "../../util"
import _setup from "./setup"
import test from "../StrategyP3Crv/create-test-harvest"

test("StrategyP3CrvUsdt", _setup, {
  DECIMALS: USDT_DECIMALS,
})
