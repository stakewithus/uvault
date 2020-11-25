import { DAI_DECIMALS } from "../../util"
import _setup from "./setup"
import test from "../StrategyCurve/create-test-withdraw-all"

test("StrategyGusdDai", _setup, {
  DECIMALS: DAI_DECIMALS,
})
