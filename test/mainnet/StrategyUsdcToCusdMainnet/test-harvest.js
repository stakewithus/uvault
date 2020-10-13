const {USDC_DECIMALS} = require("../../util")
const setup = require("./setup")
const test = require("../StrategyStableToCurve/test-harvest")

test("StrategyUsdcToCusdMainnet", setup, {
  DECIMALS: USDC_DECIMALS,
})
