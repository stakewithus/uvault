import "../../setup"
import {
  TestTokenInstance,
  ControllerV2Instance,
  StrategyTestInstance,
  StrategyTestV2Instance,
  MockVaultInstance,
  MockTimeLockInstance,
} from "../../../types"
import BN from "bn.js"

const TestToken = artifacts.require("TestToken")
const ControllerV2 = artifacts.require("ControllerV2")
const StrategyTest = artifacts.require("StrategyTest")
const StrategyTestV2 = artifacts.require("StrategyTestV2")
const MockTimeLock = artifacts.require("MockTimeLock")
const MockVault = artifacts.require("MockVault")

export default (accounts: Truffle.Accounts) => {
  const admin = accounts[0]
  const treasury = accounts[1]

  // references to return
  interface Refs {
    admin: string
    treasury: string
    underlying: TestTokenInstance
    controller: ControllerV2Instance
    timeLock: MockTimeLockInstance
    vault: MockVaultInstance
    strategyV1: StrategyTestInstance
    strategyV2: StrategyTestV2Instance
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
    strategyV1: null,
    // @ts-ignore
    strategyV2: null,
  }

  beforeEach(async () => {
    refs.underlying = await TestToken.new()
    refs.controller = await ControllerV2.new(treasury, {
      from: admin,
    })
    refs.timeLock = await MockTimeLock.new()
    refs.vault = await MockVault.new(
      refs.controller.address,
      refs.timeLock.address,
      refs.underlying.address
    )
    refs.strategyV1 = await StrategyTest.new(
      refs.controller.address,
      refs.vault.address,
      refs.underlying.address
    )
    refs.strategyV2 = await StrategyTestV2.new(
      refs.controller.address,
      refs.vault.address,
      refs.underlying.address
    )

    // set vault.strategy
    await refs.vault.setStrategy(refs.strategyV2.address, new BN(0))
    // fund strategy
    await refs.strategyV2._mintToPool_(1000)
  })

  return refs
}
