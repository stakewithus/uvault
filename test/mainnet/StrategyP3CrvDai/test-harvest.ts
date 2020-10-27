import {DAI_DECIMALS} from "../../util"
import _setup from "./setup"
import test from "../StrategyP3Crv/create-test-harvest"

test("StrategyP3CrvDai", _setup, {
  DECIMALS: DAI_DECIMALS,
})
