import { DAI_DECIMALS } from "../../util"
import _setup from "./setup"
import test from "../StrategyPaxV2/create-test-harvest"

test("StrategyPaxDaiV2", _setup, {
  DECIMALS: DAI_DECIMALS,
})
