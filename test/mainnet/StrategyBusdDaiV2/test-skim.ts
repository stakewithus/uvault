import { DAI_DECIMALS } from "../../util"
import _setup from "./setup"
import test from "../StrategyBusdV2/create-test-skim"

test("StrategyBusdDaiV2", _setup, {
  DECIMALS: DAI_DECIMALS,
})
