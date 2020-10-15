import "../setup"
import BN from "bn.js"
import {Erc20TokenInstance} from "../../types/Erc20Token"
import {MockGasTokenInstance} from "../../types/MockGasToken"
import {GasRelayerInstance} from "../../types/GasRelayer"
import {ControllerInstance} from "../../types/Controller"
import {VaultInstance} from "../../types/Vault"
import {StrategyTestInstance} from "../../types/StrategyTest"
import {pow} from "../util"

const ERC20Token = artifacts.require("ERC20Token")
const MockGasToken = artifacts.require("MockGasToken")
const GasRelayer = artifacts.require("GasRelayer")
const Controller = artifacts.require("Controller")
const Vault = artifacts.require("Vault")
const StrategyTest = artifacts.require("StrategyTest")

export default (accounts: Truffle.Accounts) => {
  const admin = accounts[0]
  const treasury = accounts[1]
  const whale = accounts[2]

  const MIN_WAIT_TIME = 0

  // references to return
  interface Refs {
    admin: string
    treasury: string
    underlying: Erc20TokenInstance
    gasToken: MockGasTokenInstance
    gasRelayer: GasRelayerInstance
    controller: ControllerInstance
    vault: VaultInstance
    strategy: StrategyTestInstance
    MIN_WAIT_TIME: number
    whale: string
  }

  const refs: Refs = {
    admin,
    treasury,
    // @ts-ignore
    underlying: null,
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
    MIN_WAIT_TIME,
    whale,
  }

  beforeEach(async () => {
    const underlying = await ERC20Token.new()
    const gasToken = await MockGasToken.new()
    const gasRelayer = await GasRelayer.new(gasToken.address, {
      from: admin,
    })
    const controller = await Controller.new(treasury, {
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

    const adminRole = await controller.ADMIN_ROLE()
    await controller.grantRole(adminRole, gasRelayer.address, {from: admin})

    // deposit into vault
    const amount = pow(10, 18).mul(new BN(100))
    await underlying.mint(whale, amount)
    await underlying.approve(vault.address, amount, {from: whale})
    await vault.deposit(amount, {from: whale})

    // set strategy
    await vault.setNextStrategy(strategy.address, {from: admin})
    await controller.setStrategy(vault.address, strategy.address, new BN(0), {
      from: admin,
    })
  })

  return refs
}
