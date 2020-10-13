const {USDC_DECIMALS} = require("../../util")
const setup = require("./setup")
const test = require("../StrategyStableToCurve/test-withdraw")

test("StrategyUsdcToCusdMainnet", setup, {
  DECIMALS: USDC_DECIMALS,
})
