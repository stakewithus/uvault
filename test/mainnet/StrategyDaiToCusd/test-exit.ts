import {DAI_DECIMALS} from "../../util"
import _setup from "./setup"
import test from "../StrategyStableToCurve/create-test-exit"

test("StrategyDaiToCusd", _setup, {
  DECIMALS: DAI_DECIMALS,
})
