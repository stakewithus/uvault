const {USDC_DECIMALS, USDC_TO_CUSD_DECIMALS} = require("../../util")
const setup = require("./setup")
const test = require("../StrategyStableToCurve/create-test-deposit")

test("StrategyUsdcToCusdMainnet", setup, {
  DECIMALS: USDC_DECIMALS,
  UNDERLYING_TO_CURVE_DECIMALS: USDC_TO_CUSD_DECIMALS
})
