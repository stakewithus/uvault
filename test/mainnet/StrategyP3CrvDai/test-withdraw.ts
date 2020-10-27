import {DAI_DECIMALS} from "../../util"
import _setup from "./setup"
import test from "../StrategyP3Crv/create-test-withdraw"

test("StrategyP3CrvDai", _setup, {
  DECIMALS: DAI_DECIMALS,
})
