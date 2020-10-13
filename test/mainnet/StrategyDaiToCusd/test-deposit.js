const {DAI_DECIMALS, DAI_TO_CUSD_DECIMALS} = require("../../util")
const setup = require("./setup")
const test = require("../StrategyStableToCurve/create-test-deposit")

test("StrategyDaiToCusd", setup, {
  DECIMALS: DAI_DECIMALS,
  UNDERLYING_TO_CURVE_DECIMALS: DAI_TO_CUSD_DECIMALS
})
