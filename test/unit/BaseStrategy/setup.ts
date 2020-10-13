import "../../setup"
import {Erc20TokenInstance} from "../../../types/Erc20Token"
import {MockControllerInstance} from "../../../types/MockController"
import {MockVaultInstance} from "../../../types/MockVault"
import {BaseStrategyInstance} from "../../../types/BaseStrategy"

const ERC20Token = artifacts.require("ERC20Token")
const MockController = artifacts.require("MockController")
const MockVault = artifacts.require("MockVault")
const BaseStrategy = artifacts.require("BaseStrategy")

export default (accounts: Truffle.Accounts) => {
  const admin = accounts[0]
  const treasury = accounts[1]

  // references to return
  interface Refs {
    admin: string,
    treasury: string,
    erc20: Erc20TokenInstance
    controller: MockControllerInstance
    vault: MockVaultInstance
    strategy: BaseStrategyInstance
  }

  const refs: Refs = {
    admin,
    treasury,
    // @ts-ignore
    erc20: null,
    // @ts-ignore
    controller: null,
    // @ts-ignore
    vault: null,
    // @ts-ignore
    strategy: null
  }

  beforeEach(async () => {
    refs.erc20 = await ERC20Token.new()
    refs.controller = await MockController.new(treasury)
    refs.vault = await MockVault.new(refs.controller.address, refs.erc20.address)
    refs.strategy = await BaseStrategy.new(
      refs.controller.address,
      refs.vault.address,
      {from: admin}
    )
  })

  return refs
}
