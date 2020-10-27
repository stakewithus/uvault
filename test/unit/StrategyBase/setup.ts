import "../../setup"
import {Erc20TokenInstance} from "../../../types/Erc20Token"
import {MockControllerInstance} from "../../../types/MockController"
import {MockVaultInstance} from "../../../types/MockVault"
import {TestStrategyBaseInstance} from "../../../types/TestStrategyBase"

const ERC20Token = artifacts.require("ERC20Token")
const MockController = artifacts.require("MockController")
const MockVault = artifacts.require("MockVault")
const TestStrategyBase = artifacts.require("TestStrategyBase")

export default (accounts: Truffle.Accounts) => {
  const admin = accounts[0]
  const treasury = accounts[1]

  // references to return
  interface Refs {
    admin: string
    treasury: string
    underlying: Erc20TokenInstance
    controller: MockControllerInstance
    vault: MockVaultInstance
    strategy: TestStrategyBaseInstance
  }

  const refs: Refs = {
    admin,
    treasury,
    // @ts-ignore
    underlying: null,
    // @ts-ignore
    controller: null,
    // @ts-ignore
    vault: null,
    // @ts-ignore
    strategy: null,
  }

  beforeEach(async () => {
    refs.underlying = await ERC20Token.new()
    refs.controller = await MockController.new(treasury)
    refs.vault = await MockVault.new(refs.controller.address, refs.underlying.address)
    refs.strategy = await TestStrategyBase.new(
      refs.controller.address,
      refs.vault.address,
      refs.underlying.address,
      {from: admin}
    )
  })

  return refs
}
