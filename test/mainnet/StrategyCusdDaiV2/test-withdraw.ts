import { DAI_DECIMALS } from "../util"
import _setup from "./setup"
import test from "../StrategyCusdV2/create-test-withdraw"

test("StrategyCusdDaiV2", _setup, {
  DECIMALS: DAI_DECIMALS,
})
