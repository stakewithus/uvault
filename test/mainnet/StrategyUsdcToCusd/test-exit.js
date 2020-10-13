const {USDC_DECIMALS} = require("../../util")
const setup = require("./setup")
const test = require("../StrategyStableToCurve/create-test-exit")

test("StrategyUsdcToCusd", setup, {
  DECIMALS: USDC_DECIMALS,
})