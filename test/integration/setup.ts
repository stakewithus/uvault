import "../setup"
import BN from "bn.js"
import {
  TestTokenInstance,
  MockGasTokenInstance,
  GasRelayerInstance,
  ControllerInstance,
  VaultInstance,
  StrategyTestInstance,
  StrategyNoOpInstance,
} from "../../types"
import { pow } from "../util"

const TestToken = artifacts.require("TestToken")
const MockGasToken = artifacts.require("MockGasToken")
const GasRelayer = artifacts.require("GasRelayer")
const Controller = artifacts.require("Controller")
const Vault = artifacts.require("Vault")
const StrategyTest = artifacts.require("StrategyTest")
const StrategyNoOp = artifacts.require("StrategyNoOp")

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
    strategyNoOp: StrategyNoOpInstance
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
    // @ts-ignore
    strategyNoOp: null,
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
    const strategyNoOp = await StrategyNoOp.new(
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
    refs.strategyNoOp = strategyNoOp

    const adminRole = await controller.ADMIN_ROLE()
    await controller.grantRole(adminRole, gasRelayer.address, { from: admin })

    // deposit into vault
    const amount = pow(10, 18).mul(new BN(100))
    await underlying._mint_(whale, amount)
    await underlying.approve(vault.address, amount, { from: whale })
    await vault.deposit(amount, { from: whale })

    // approve StrategyNoOp
    await vault.approveStrategy(strategyNoOp.address, { from: timeLock })

    // set strategy
    await vault.approveStrategy(strategy.address, { from: timeLock })
    await controller.setStrategy(vault.address, strategy.address, new BN(0), {
      from: admin,
    })
  })

  return refs
}
