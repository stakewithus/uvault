import "../setup"
import BN from "bn.js"
import {
  TestTokenInstance,
  ControllerInstance,
  ERC20VaultInstance,
  ETHVaultInstance,
  StrategyERC20TestInstance,
  StrategyETHTestInstance,
  StrategyNoOpERC20Instance,
  StrategyNoOpETHInstance,
} from "../../types"
import { pow } from "../util"

const TestToken = artifacts.require("TestToken")
const Controller = artifacts.require("Controller")
const ERC20Vault = artifacts.require("ERC20Vault")
const ETHVault = artifacts.require("ETHVault")
const StrategyERC20Test = artifacts.require("StrategyERC20Test")
const StrategyETHTest = artifacts.require("StrategyETHTest")
const StrategyNoOpERC20 = artifacts.require("StrategyNoOpERC20")
const StrategyNoOpETH = artifacts.require("StrategyNoOpETH")

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
    controller: ControllerInstance
    erc20Vault: ERC20VaultInstance
    ethVault: ETHVaultInstance
    strategyErc20: StrategyERC20TestInstance
    strategyNoOpErc20: StrategyNoOpERC20Instance
    strategyEth: StrategyETHTestInstance
    strategyNoOpEth: StrategyNoOpETHInstance
    whale: string
  }

  const refs: Refs = {
    admin,
    treasury,
    timeLock,
    // @ts-ignore
    underlying: null,
    // @ts-ignore
    controller: null,
    // @ts-ignore
    erc20Vault: null,
    // @ts-ignore
    ethVault: null,
    // @ts-ignore
    strategyErc20: null,
    // @ts-ignore
    strategyNoOpErc20: null,
    // @ts-ignore
    strategyEth: null,
    // @ts-ignore
    strategyNoOpEth: null,
    whale,
  }

  before(async () => {
    const underlying = await TestToken.new()
    const controller = await Controller.new(treasury, {
      from: admin,
    })
    // vaults
    const erc20Vault = await ERC20Vault.new(
      controller.address,
      timeLock,
      underlying.address,
      {
        from: admin,
      }
    )
    const ethVault = await ETHVault.new(controller.address, timeLock, {
      from: admin,
    })

    // strategies
    const strategyErc20 = await StrategyERC20Test.new(
      controller.address,
      erc20Vault.address,
      underlying.address,
      {
        from: admin,
      }
    )
    const strategyNoOpErc20 = await StrategyNoOpERC20.new(
      controller.address,
      erc20Vault.address,
      underlying.address,
      {
        from: admin,
      }
    )
    const strategyEth = await StrategyETHTest.new(
      controller.address,
      ethVault.address,
      {
        from: admin,
      }
    )
    const strategyNoOpEth = await StrategyNoOpETH.new(
      controller.address,
      ethVault.address,
      {
        from: admin,
      }
    )

    refs.underlying = underlying
    refs.controller = controller
    refs.erc20Vault = erc20Vault
    refs.ethVault = ethVault
    refs.strategyErc20 = strategyErc20
    refs.strategyNoOpErc20 = strategyNoOpErc20
    refs.strategyEth = strategyEth
    refs.strategyNoOpEth = strategyNoOpEth

    // deposit into vaults //
    const amount = pow(10, 18)
    // erc20 vault
    await underlying._mint_(whale, amount)
    await underlying.approve(erc20Vault.address, amount, { from: whale })
    await erc20Vault.deposit(amount, { from: whale })
    // eth vault
    await ethVault.deposit({ from: whale, value: amount })

    // strategies //
    // approve
    await erc20Vault.approveStrategy(strategyErc20.address, { from: timeLock })
    await erc20Vault.approveStrategy(strategyNoOpErc20.address, { from: timeLock })
    await ethVault.approveStrategy(strategyEth.address, { from: timeLock })
    await ethVault.approveStrategy(strategyNoOpEth.address, { from: timeLock })

    await controller.approveVault(erc20Vault.address, { from: admin })
    await controller.approveVault(ethVault.address, { from: admin })

    await controller.approveStrategy(strategyErc20.address, { from: admin })
    await controller.approveStrategy(strategyNoOpErc20.address, { from: admin })
    await controller.approveStrategy(strategyEth.address, { from: admin })
    await controller.approveStrategy(strategyNoOpEth.address, { from: admin })

    // set strategy
    await controller.setStrategy(erc20Vault.address, strategyErc20.address, new BN(0), {
      from: admin,
    })
    await controller.setStrategy(ethVault.address, strategyEth.address, new BN(0), {
      from: admin,
    })
  })

  return refs
}
