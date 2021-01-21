import { DAI_DECIMALS } from "../../util"
import _setup from "./setup"
import test from "../Strategy3CrvV2/create-test-exit"

test("Strategy3CrvDaiV2", _setup, {
  DECIMALS: DAI_DECIMALS,
})
