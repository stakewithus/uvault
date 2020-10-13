const {CRV} = require("../../config")
const {sendEther} = require("../../util")

const IERC20 = artifacts.require("IERC20")
const Gauge = artifacts.require("Gauge")
const Controller = artifacts.require("Controller")

module.exports = (accounts, { Strategy, underlying, cUnderlying, gauge, whale }) => {
  const admin = accounts[0]
  const vault = accounts[1]
  const treasury = accounts[2]
  // mock contract addresses
  const gasRelayer = accounts[3]

  before(async () => {
    await sendEther(web3, accounts[0], whale, 1)
  })

  // references to return
  const refs = {
    admin,
    vault,
    treasury,
    underlying: null,
    cUnderlying: null,
    gauge: null,
    crv: null,
    controller: null,
    strategy: null,
    whale,
  }

  beforeEach(async () => {
    refs.underlying = await IERC20.at(underlying)
    refs.cUnderlying = await IERC20.at(cUnderlying)
    refs.gauge = await Gauge.at(gauge)
    refs.crv = await IERC20.at(CRV)
    refs.controller = await Controller.new(treasury, gasRelayer)
    refs.strategy = await Strategy.new(refs.controller.address, vault)
  })

  return refs
}
