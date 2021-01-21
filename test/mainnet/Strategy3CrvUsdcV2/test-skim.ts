import { USDC_DECIMALS } from "../../util"
import _setup from "./setup"
import test from "../Strategy3CrvV2/create-test-skim"

test("Strategy3CrvUsdcV2", _setup, {
  DECIMALS: USDC_DECIMALS,
})
