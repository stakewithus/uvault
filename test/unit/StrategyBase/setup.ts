import "../../setup"
import {TestTokenInstance} from "../../../types/TestToken"
import {MockControllerInstance} from "../../../types/MockController"
import {MockVaultInstance} from "../../../types/MockVault"
import {StrategyTestInstance} from "../../../types/StrategyTest"

const TestToken = artifacts.require("TestToken")
const MockController = artifacts.require("MockController")
const MockVault = artifacts.require("MockVault")
const StrategyTest = artifacts.require("StrategyTest")

export default (accounts: Truffle.Accounts) => {
  const admin = accounts[0]
  const treasury = accounts[1]

  // references to return
  interface Refs {
    admin: string
    treasury: string
    underlying: TestTokenInstance
    controller: MockControllerInstance
    vault: MockVaultInstance
    strategy: StrategyTestInstance
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
    refs.underlying = await TestToken.new()
    refs.controller = await MockController.new(treasury)
    refs.vault = await MockVault.new(refs.controller.address, refs.underlying.address)
    refs.strategy = await StrategyTest.new(
      refs.controller.address,
      refs.vault.address,
      refs.underlying.address,
      {from: admin}
    )
  })

  return refs
}
