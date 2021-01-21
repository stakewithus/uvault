import { USDT_DECIMALS } from "../../util"
import _setup from "./setup"
import test from "../Strategy3CrvV2/create-test-skim"

test("Strategy3CrvUsdtV2", _setup, {
  DECIMALS: USDT_DECIMALS,
})
