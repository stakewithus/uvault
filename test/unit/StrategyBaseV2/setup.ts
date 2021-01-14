import "../../setup"
import {
  TestTokenInstance,
  MockControllerV2Instance,
  StrategyTestV2Instance,
  MockVaultInstance,
  MockTimeLockInstance,
} from "../../../types"

const TestToken = artifacts.require("TestToken")
const MockControllerV2 = artifacts.require("MockControllerV2")
const MockTimeLock = artifacts.require("MockTimeLock")
const MockVault = artifacts.require("MockVault")
const StrategyTestV2 = artifacts.require("StrategyTestV2")

export default (accounts: Truffle.Accounts) => {
  const admin = accounts[0]
  const treasury = accounts[1]

  // references to return
  interface Refs {
    admin: string
    treasury: string
    underlying: TestTokenInstance
    controller: MockControllerV2Instance
    timeLock: MockTimeLockInstance
    vault: MockVaultInstance
    strategy: StrategyTestV2Instance
  }

  const refs: Refs = {
    admin,
    treasury,
    // @ts-ignore
    underlying: null,
    // @ts-ignore
    controller: null,
    // @ts-ignore
    timeLock: null,
    // @ts-ignore
    vault: null,
    // @ts-ignore
    strategy: null,
  }

  beforeEach(async () => {
    refs.underlying = await TestToken.new()
    refs.controller = await MockControllerV2.new(treasury)
    refs.timeLock = await MockTimeLock.new()
    refs.vault = await MockVault.new(
      refs.controller.address,
      refs.timeLock.address,
      refs.underlying.address
    )
    refs.strategy = await StrategyTestV2.new(
      refs.controller.address,
      refs.vault.address,
      refs.underlying.address,
      { from: admin }
    )
  })

  return refs
}
