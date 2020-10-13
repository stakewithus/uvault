const {DAI_DECIMALS} = require("../../util")
const setup = require("./setup")
const test = require("../StrategyStableToCurve/create-test-harvest")

test("StrategyDaiToCusd", setup, {
  DECIMALS: DAI_DECIMALS,
})
