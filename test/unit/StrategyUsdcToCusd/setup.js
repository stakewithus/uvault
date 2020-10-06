const MockUSDC = artifacts.require("MockUSDC")
const MockCUSD = artifacts.require("MockCUSD")
const MockDepositCompound = artifacts.require("MockDepositCompound")
const MockGauge = artifacts.require("MockGauge")
const MockMinter = artifacts.require("MockMinter")
const MockCRV = artifacts.require("MockCRV")
const MockUniswap = artifacts.require("MockUniswap")
const MockWETH = artifacts.require("MockWETH")
const MockController = artifacts.require("MockController")
const MockVault = artifacts.require("MockVault")
const StrategyUsdcToCusd = artifacts.require("StrategyUsdcToCusd")

module.exports = (accounts) => {
  const admin = accounts[0]
  const treasury = accounts[1]

  // references to return
  const refs = {
    admin,
    treasury,
    vault: null,
    controller: null,
    strategy: null,
    usdc: null,
    cUsd: null,
    depositC: null,
    gauge: null,
    minter: null,
    crv: null,
    uniswap: null,
    weth: null,
  }

  beforeEach(async () => {
    refs.usdc = await MockUSDC.new()
    refs.cUsd = await MockCUSD.new()
    refs.depositC = await MockDepositCompound.new()
    refs.gauge = await MockGauge.new()
    refs.minter = await MockMinter.new()
    refs.crv = await MockCRV.new()
    refs.uniswap = await MockUniswap.new()
    refs.weth = await MockWETH.new()

    refs.controller = await MockController.new(treasury, {from: admin})
    refs.vault = await MockVault.new(refs.controller.address, refs.usdc.address, {
      from: admin,
    })

    refs.strategy = await StrategyUsdcToCusd.new(
      refs.controller.address,
      refs.vault.address,
      refs.usdc.address,
      refs.cUsd.address,
      refs.depositC.address,
      refs.gauge.address,
      refs.minter.address,
      refs.crv.address,
      refs.uniswap.address,
      refs.weth.address,
      {from: admin}
    )
  })

  return refs
}
