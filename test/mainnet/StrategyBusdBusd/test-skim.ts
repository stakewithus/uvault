import { BUSD_DECIMALS } from "../../util"
import _setup from "./setup"
import test from "../StrategyBusdV2/create-test-skim"

test("StrategyBusdBusdV2", _setup, {
  DECIMALS: BUSD_DECIMALS,
})
