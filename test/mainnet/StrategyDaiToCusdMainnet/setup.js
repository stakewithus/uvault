const {DAI, DAI_WHALE, CUSD, CGAUGE, CRV} = require("../../config")
const {sendEther} = require("../../util")

const IERC20 = artifacts.require("IERC20")
const Gauge = artifacts.require("Gauge")
const Controller = artifacts.require("Controller")
const StrategyDaiToCusdMainnet = artifacts.require("StrategyDaiToCusdMainnet")

module.exports = (accounts) => {
  const admin = accounts[0]
  const vault = accounts[1]
  const treasury = accounts[2]
  // mock contract addresses
  const gasRelayer = accounts[3]

  before(async () => {
    await sendEther(web3, accounts[0], DAI_WHALE, 1)
  })

  // references to return
  const refs = {
    admin,
    vault,
    treasury,
    dai: null,
    cUsd: null,
    cGauge: null,
    crv: null,
    controller: null,
    strategy: null,
  }

  beforeEach(async () => {
    refs.dai = await IERC20.at(DAI)
    refs.cUsd = await IERC20.at(CUSD)
    refs.cGauge = await Gauge.at(CGAUGE)
    refs.crv = await IERC20.at(CRV)
    refs.controller = await Controller.new(treasury, gasRelayer)
    refs.strategy = await StrategyDaiToCusdMainnet.new(refs.controller.address, vault)
  })

  return refs
}
