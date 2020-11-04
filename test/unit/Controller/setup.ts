import "../../setup"
import {TestTokenInstance} from "../../../types/TestToken"
import {ControllerInstance} from "../../../types/Controller"
import {StrategyTestInstance} from "../../../types/StrategyTest"
import {MockVaultInstance} from "../../../types/MockVault"

const TestToken = artifacts.require("TestToken")
const Controller = artifacts.require("Controller")
const StrategyTest = artifacts.require("StrategyTest")
const MockVault = artifacts.require("MockVault")

export default (accounts: Truffle.Accounts) => {
  const admin = accounts[0]
  const treasury = accounts[1]

  // references to return
  interface Refs {
    admin: string
    treasury: string
    underlying: TestTokenInstance
    controller: ControllerInstance
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
    refs.controller = await Controller.new(treasury, {
      from: admin,
    })
    refs.vault = await MockVault.new(refs.controller.address, refs.underlying.address)
    refs.strategy = await StrategyTest.new(
      refs.controller.address,
      refs.vault.address,
      refs.underlying.address
    )

    // fund strategy
    await refs.underlying.mint(refs.strategy.address, 1000)
  })

  return refs
}
