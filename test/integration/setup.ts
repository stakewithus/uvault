import "../setup"
import BN from "bn.js"
import {TestTokenInstance} from "../../types/TestToken"
import {MockGasTokenInstance} from "../../types/MockGasToken"
import {GasRelayerInstance} from "../../types/GasRelayer"
import {ControllerInstance} from "../../types/Controller"
import {VaultInstance} from "../../types/Vault"
import {StrategyTestInstance} from "../../types/StrategyTest"
import {pow} from "../util"

const TestToken = artifacts.require("TestToken")
const MockGasToken = artifacts.require("MockGasToken")
const GasRelayer = artifacts.require("GasRelayer")
const Controller = artifacts.require("Controller")
const Vault = artifacts.require("Vault")
const StrategyTest = artifacts.require("StrategyTest")

export default (accounts: Truffle.Accounts) => {
  const admin = accounts[0]
  const treasury = accounts[1]
  const whale = accounts[2]

  // Mock time lock contract
  const timeLock = accounts[3]

  // references to return
  interface Refs {
    admin: string
    treasury: string
    timeLock: string
    underlying: TestTokenInstance
    gasToken: MockGasTokenInstance
    gasRelayer: GasRelayerInstance
    controller: ControllerInstance
    vault: VaultInstance
    strategy: StrategyTestInstance
    whale: string
  }

  const refs: Refs = {
    admin,
    treasury,
    timeLock,
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
    whale,
  }

  beforeEach(async () => {
    const underlying = await TestToken.new()
    const gasToken = await MockGasToken.new()
    const gasRelayer = await GasRelayer.new(gasToken.address, {
      from: admin,
    })
    const controller = await Controller.new(treasury, {
      from: admin,
    })
    const vault = await Vault.new(controller.address, timeLock, underlying.address, {
      from: admin,
    })
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
    await underlying._mint_(whale, amount)
    await underlying.approve(vault.address, amount, {from: whale})
    await vault.deposit(amount, {from: whale})

    // set strategy
    await vault.approveStrategy(strategy.address, {from: timeLock})
    await controller.setStrategy(vault.address, strategy.address, new BN(0), {
      from: admin,
    })
  })

  return refs
}
