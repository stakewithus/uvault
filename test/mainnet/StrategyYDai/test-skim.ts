import { DAI_DECIMALS } from "../../util"
import _setup from "./setup"
import test from "../StrategyCurve/create-test-skim"

test("StrategyYDai", _setup, {
  DECIMALS: DAI_DECIMALS,
})
