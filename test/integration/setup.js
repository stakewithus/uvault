const BN = require("bn.js")

const ERC20Token = artifacts.require("ERC20Token")
const MockGasToken = artifacts.require("MockGasToken")
const GasRelayer = artifacts.require("GasRelayer")
const Controller = artifacts.require("Controller")
const Vault = artifacts.require("Vault")
const StrategyTest = artifacts.require("StrategyTest")

module.exports = (accounts) => {
  const admin = accounts[0]
  const treasury = accounts[1]
  const whale = accounts[2]

  const MIN_WAIT_TIME = 0

  // references to return
  const refs = {
    admin,
    treasury,
    underlying: null,
    gasToken: null,
    gasRelayer: null,
    contoller: null,
    vault: null,
    strategy: null,
    MIN_WAIT_TIME,
    whale,
  }

  beforeEach(async () => {
    const underlying = await ERC20Token.new()
    const gasToken = await MockGasToken.new()
    const gasRelayer = await GasRelayer.new(gasToken.address, {
      from: admin,
    })
    const controller = await Controller.new(treasury, gasRelayer.address, {
      from: admin,
    })
    const vault = await Vault.new(
      controller.address,
      underlying.address,
      MIN_WAIT_TIME,
      {
        from: admin,
      }
    )
    const strategy = await StrategyTest.new(
      controller.address,
      vault.address,
      underlying.address,
      {
        from: admin,
      }
    )

    refs.underlying = underlying
    refs.gasToken = gasToken
    refs.gasRelayer = gasRelayer
    refs.controller = controller
    refs.vault = vault
    refs.strategy = strategy

    // deposit into vault
    const amount = new BN(10).pow(new BN(18)).mul(new BN(100))
    await underlying.mint(whale, amount)
    await underlying.approve(vault.address, amount, {from: whale})
    await vault.deposit(amount, {from: whale})

    // set strategy
    await vault.setNextStrategy(strategy.address, {from: admin})
    await controller.setStrategy(vault.address, strategy.address, {from: admin})
  })

  return refs
}
