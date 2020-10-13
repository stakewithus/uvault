const {USDT_DECIMALS} = require("../../util")
const setup = require("./setup")
const test = require("../StrategyStableToCurve/create-test-withdraw-all")

test("StrategyUsdtTo3Crv", setup, {
  DECIMALS: USDT_DECIMALS,
})
