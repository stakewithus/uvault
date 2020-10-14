import "../setup"
import BN from "bn.js"
import {Ierc20Instance} from "../../types/Ierc20"
import {GasTokenInstance} from "../../types/GasToken"
import {GasRelayerInstance} from "../../types/GasRelayer"
import {ControllerInstance} from "../../types/Controller"
import {VaultInstance} from "../../types/Vault"
import {StrategyTestInstance} from "../../types/StrategyTest"
import {USDC, USDC_WHALE, CHI} from "./config"
import {sendEther, USDC_DECIMALS, pow} from "../util"

const IERC20 = artifacts.require("IERC20")
const GasToken = artifacts.require("GasToken")
const GasRelayer = artifacts.require("GasRelayer")
const Controller = artifacts.require("Controller")
const Vault = artifacts.require("Vault")
const StrategyTest = artifacts.require("StrategyTest")

export default (accounts: Truffle.Accounts) => {
  const admin = accounts[0]
  const treasury = accounts[1]

  const whale = USDC_WHALE
  const UNDERLYING = USDC
  const UNDERLYING_DECIMALS = USDC_DECIMALS
  const MIN_WAIT_TIME = 0

  // references to return
  interface Refs {
    admin: string
    treasury: string
    gasToken: GasTokenInstance
    gasRelayer: GasRelayerInstance
    controller: ControllerInstance
    vault: VaultInstance
    strategy: StrategyTestInstance
    underlying: Ierc20Instance
    whale: string
    UNDERLYING_DECIMALS: BN
    MIN_WAIT_TIME: number
  }

  const refs: Refs = {
    admin,
    treasury,
    // @ts-ignore
    gasToken: null,
    // @ts-ignore
    gasRelayer: null,
    // @ts-ignore
    controller: null,
    // @ts-ignore
    vault: null,
    // @ts-ignore
    strategy: null,
    // @ts-ignore
    underlying: null,
    whale,
    UNDERLYING_DECIMALS,
    MIN_WAIT_TIME,
  }

  before(async () => {
    // fund whale with Ether
    await sendEther(web3, accounts[0], whale, new BN(1))
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
    const amount = pow(10, UNDERLYING_DECIMALS).mul(new BN(10))
    await underlying.approve(vault.address, amount, {from: whale})
    await vault.deposit(amount, {from: whale})
  })

  return refs
}
