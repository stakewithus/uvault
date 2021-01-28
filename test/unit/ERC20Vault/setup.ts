import "../../setup"
import {
  TestTokenInstance,
  ERC20VaultInstance,
  MockControllerInstance,
  StrategyERC20TestInstance,
} from "../../../types"

const TestToken = artifacts.require("TestToken")
const ERC20Vault = artifacts.require("ERC20Vault")
const MockController = artifacts.require("MockController")
const StrategyERC20Test = artifacts.require("StrategyERC20Test")

export default (accounts: Truffle.Accounts) => {
  const admin = accounts[0]
  const treasury = accounts[1]
  const timeLock = accounts[2]

  // references to return
  interface Refs {
    admin: string
    treasury: string
    token: TestTokenInstance
    vault: ERC20VaultInstance
    controller: MockControllerInstance
    timeLock: string
    strategy: StrategyERC20TestInstance
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
    timeLock,
    // @ts-ignore
    strategy: null,
  }

  beforeEach(async () => {
    refs.token = await TestToken.new()
    refs.controller = await MockController.new(treasury)
    refs.vault = await ERC20Vault.new(
      refs.controller.address,
      timeLock,
      refs.token.address
    )

    refs.strategy = await StrategyERC20Test.new(
      refs.controller.address,
      refs.vault.address,
      refs.token.address,
      { from: admin }
    )
  })

  return refs
}
