import "../../setup"
import {Erc20TokenInstance} from "../../../types/Erc20Token"
import {VaultInstance} from "../../../types/Vault"
import {MockControllerInstance} from "../../../types/MockController"
import {StrategyTestInstance} from "../../../types/StrategyTest"

const ERC20Token = artifacts.require("ERC20Token")
const Vault = artifacts.require("Vault")
const MockController = artifacts.require("MockController")
const StrategyTest = artifacts.require("StrategyTest")

export default (accounts: Truffle.Accounts, minWaitTime = 0) => {
  const admin = accounts[0]
  const treasury = accounts[1]

  // references to return
  interface Refs {
    admin: string
    treasury: string
    erc20: Erc20TokenInstance
    vault: VaultInstance
    controller: MockControllerInstance
    strategy: StrategyTestInstance
  }

  const refs: Refs = {
    admin,
    treasury,
    // @ts-ignore
    erc20: null,
    // @ts-ignore
    vault: null,
    // @ts-ignore
    controller: null,
    // @ts-ignore
    strategy: null,
  }

  before(async () => {
    refs.erc20 = await ERC20Token.new()
  })

  beforeEach(async () => {
    refs.controller = await MockController.new(treasury)
    refs.vault = await Vault.new(
      refs.controller.address,
      refs.erc20.address,
      minWaitTime
    )

    refs.strategy = await StrategyTest.new(
      refs.controller.address,
      refs.vault.address,
      refs.erc20.address,
      {from: admin}
    )
  })

  return refs
}
