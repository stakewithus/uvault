import "../../setup"
import {TestTokenInstance} from "../../../types/TestToken"
import {VaultInstance} from "../../../types/Vault"
import {MockControllerInstance} from "../../../types/MockController"
import {MockTimeLockInstance} from "../../../types/MockTimeLock"
import {StrategyTestInstance} from "../../../types/StrategyTest"

const ERC20Token = artifacts.require("ERC20Token")
const Vault = artifacts.require("Vault")
const MockController = artifacts.require("MockController")
const MockTimeLock = artifacts.require("MockTimeLock")
const StrategyTest = artifacts.require("StrategyTest")

export default (accounts: Truffle.Accounts) => {
  const admin = accounts[0]
  const treasury = accounts[1]

  // references to return
  interface Refs {
    admin: string
    treasury: string
    token: TestTokenInstance
    vault: VaultInstance
    controller: MockControllerInstance
    timeLock: MockTimeLockInstance
    strategy: StrategyTestInstance
  }

  const refs: Refs = {
    admin,
    treasury,
    // @ts-ignore
    token: null,
    // @ts-ignore
    vault: null,
    // @ts-ignore
    controller: null,
    // @ts-ignore
    timeLock: null,
    // @ts-ignore
    strategy: null,
  }

  before(async () => {
    refs.token = await ERC20Token.new()
  })

  beforeEach(async () => {
    refs.controller = await MockController.new(treasury)
    refs.timeLock = await MockTimeLock.new()
    refs.vault = await Vault.new(
      refs.controller.address,
      refs.timeLock.address,
      refs.token.address
    )

    refs.strategy = await StrategyTest.new(
      refs.controller.address,
      refs.vault.address,
      refs.token.address,
      {from: admin}
    )
  })

  return refs
}
