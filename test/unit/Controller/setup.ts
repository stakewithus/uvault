import "../../setup"
import {
  TestTokenInstance,
  ControllerInstance,
  MockERC20VaultInstance,
  MockETHVaultInstance,
  StrategyERC20TestInstance,
  StrategyETHTestInstance,
} from "../../../types"
import BN from "bn.js"

const TestToken = artifacts.require("TestToken")
const Controller = artifacts.require("Controller")
const MockERC20Vault = artifacts.require("MockERC20Vault")
const MockETHVault = artifacts.require("MockETHVault")
const StrategyERC20Test = artifacts.require("StrategyERC20Test")
const StrategyETHTest = artifacts.require("StrategyETHTest")

export default (accounts: Truffle.Accounts) => {
  const admin = accounts[0]
  const treasury = accounts[1]
  const timeLock = accounts[2]

  // references to return
  interface Refs {
    admin: string
    treasury: string
    underlying: TestTokenInstance
    controller: ControllerInstance
    timeLock: string
    erc20Vault: MockERC20VaultInstance
    ethVault: MockETHVaultInstance
    strategyErc20: StrategyERC20TestInstance
    strategyEth: StrategyETHTestInstance
  }

  const refs: Refs = {
    admin,
    treasury,
    // @ts-ignore
    underlying: null,
    // @ts-ignore
    controller: null,
    timeLock,
    // @ts-ignore
    erc20Vault: null,
    // @ts-ignore
    ethVault: null,
    // @ts-ignore
    strategyErc20: null,
    // @ts-ignore
    strategyEth: null,
  }

  beforeEach(async () => {
    refs.underlying = await TestToken.new()
    refs.controller = await Controller.new(treasury, {
      from: admin,
    })
    refs.erc20Vault = await MockERC20Vault.new(
      refs.controller.address,
      timeLock,
      refs.underlying.address
    )
    refs.ethVault = await MockETHVault.new(refs.controller.address, timeLock)
    refs.strategyErc20 = await StrategyERC20Test.new(
      refs.controller.address,
      refs.erc20Vault.address,
      refs.underlying.address
    )
    refs.strategyEth = await StrategyETHTest.new(
      refs.controller.address,
      refs.ethVault.address
    )

    await refs.controller.approveVault(refs.erc20Vault.address)
    await refs.controller.approveVault(refs.ethVault.address)
    await refs.controller.approveStrategy(refs.strategyErc20.address)
    await refs.controller.approveStrategy(refs.strategyEth.address)

    // set vault.strategy
    await refs.erc20Vault.setStrategy(refs.strategyErc20.address, new BN(0))
    await refs.ethVault.setStrategy(refs.strategyEth.address, new BN(0))

    // fund strategy
    await refs.underlying._mint_(refs.strategyErc20.address, 100)
    await refs.strategyEth.sendTransaction({ from: admin, value: 100 })
  })

  return refs
}
