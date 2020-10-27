import {DAI_DECIMALS} from "../../util"
import _setup from "./setup"
import test from "../StrategyStableToP3Crv/create-test-withdraw"

test("StrategyDaiToP3Crv", _setup, {
  DECIMALS: DAI_DECIMALS,
})
