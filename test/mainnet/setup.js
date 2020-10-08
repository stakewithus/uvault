const BN = require("bn.js")
const {USDC, USDC_WHALE, USDC_DECIMALS, CHI} = require("../config")
const {sendEther} = require("../util")

const IERC20 = artifacts.require("IERC20")
const GasToken = artifacts.require("GasToken")
const GasRelayer = artifacts.require("GasRelayer")
const Controller = artifacts.require("Controller")
const Vault = artifacts.require("Vault")
const StrategyTest = artifacts.require("StrategyTest")

module.exports = (accounts) => {
  const admin = accounts[0]
  const treasury = accounts[1]

  const whale = USDC_WHALE
  const UNDERLYING = USDC
  const UNDERLYING_DECIMALS = USDC_DECIMALS
  const MIN_WAIT_TIME = 0

  // references to return
  const refs = {
    admin,
    treasury,
    gasToken: null,
    gasRelayer: null,
    contoller: null,
    vault: null,
    strategy: null,
    underlying: null,
    whale,
    UNDERLYING_DECIMALS,
    MIN_WAIT_TIME,
  }

  before(async () => {
    // fund whale with Ether
    await sendEther(web3, accounts[0], whale, 1)
  })

  beforeEach(async () => {
    const gasToken = await GasToken.at(CHI)
    const gasRelayer = await GasRelayer.new(gasToken.address, {
      from: admin,
    })
    const controller = await Controller.new(treasury, gasRelayer.address, {
      from: admin,
    })
    const vault = await Vault.new(controller.address, UNDERLYING, MIN_WAIT_TIME, {
      from: admin,
    })
    const strategy = await StrategyTest.new(
      controller.address,
      vault.address,
      UNDERLYING,
      {
        from: admin,
      }
    )
    const underlying = await IERC20.at(UNDERLYING)

    refs.gasToken = gasToken
    refs.gasRelayer = gasRelayer
    refs.controller = controller
    refs.vault = vault
    refs.strategy = strategy
    refs.underlying = underlying

    // Mint gas token
    await gasRelayer.mintGasToken(10)

    // set strategy
    await vault.setNextStrategy(strategy.address, {from: admin})
    await controller.setStrategy(vault.address, strategy.address, {from: admin})

    // deposit into vault
    const amount = new BN(10).pow(new BN(UNDERLYING_DECIMALS)).mul(new BN(10))
    await underlying.approve(vault.address, amount, {from: whale})
    await vault.deposit(amount, {from: whale})
  })

  return refs
}
