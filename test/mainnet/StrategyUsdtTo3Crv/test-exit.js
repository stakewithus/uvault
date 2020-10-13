const {USDT_DECIMALS} = require("../../util")
const setup = require("./setup")
const test = require("../StrategyStableToCurve/create-test-exit")

test("StrategyUsdtTo3Crv", setup, {
  DECIMALS: USDT_DECIMALS,
})