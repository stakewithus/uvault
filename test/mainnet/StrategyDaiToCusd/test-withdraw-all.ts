import {DAI_DECIMALS} from "../../util"
import _setup from "./setup"
import test from "../StrategyStableToCurve/create-test-withdraw-all"

test("StrategyDaiToCusd", _setup, {
  DECIMALS: DAI_DECIMALS,
})
