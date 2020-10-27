import {USDT_DECIMALS} from "../../util"
import _setup from "./setup"
import test from "../StrategyP3Crv/create-test-exit"

test("StrategyP3CrvUsdt", _setup, {
  DECIMALS: USDT_DECIMALS,
})
