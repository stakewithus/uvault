const {DAI_DECIMALS} = require("../../util")
const setup = require("./setup")
const test = require("../StrategyStableToCurve/create-test-harvest")

test("StrategyDaiTo3Crv", setup, {
  DECIMALS: DAI_DECIMALS,
})
