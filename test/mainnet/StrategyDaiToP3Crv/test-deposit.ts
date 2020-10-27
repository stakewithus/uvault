import {DAI_DECIMALS} from "../../util"
import _setup from "./setup"
import test from "../StrategyStableToP3Crv/create-test-deposit"

test("StrategyDaiToP3Crv", _setup, {
  DECIMALS: DAI_DECIMALS,
})
