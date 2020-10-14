import {DAI_DECIMALS} from "../../util"
import _setup from "./setup"
import test from "../StrategyStableToCurve/create-test-harvest"

test("StrategyDaiTo3Crv", _setup, {
  DECIMALS: DAI_DECIMALS,
})
