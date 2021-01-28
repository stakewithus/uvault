import "../../setup"
import {
  TestTokenInstance,
  ControllerInstance,
  StrategyERC20TestInstance,
  MockVaultInstance,
  MockTimeLockInstance,
} from "../../../types"
import BN from "bn.js"

const TestToken = artifacts.require("TestToken")
const Controller = artifacts.require("Controller")
const StrategyERC20Test = artifacts.require("StrategyERC20Test")
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
    controller: ControllerInstance
    timeLock: MockTimeLockInstance
    vault: MockVaultInstance
    strategy: StrategyERC20TestInstance
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
    refs.controller = await Controller.new(treasury, {
      from: admin,
    })
    refs.timeLock = await MockTimeLock.new()
    refs.vault = await MockVault.new(
      refs.controller.address,
      refs.timeLock.address,
      refs.underlying.address
    )
    refs.strategy = await StrategyERC20Test.new(
      refs.controller.address,
      refs.vault.address,
      refs.underlying.address
    )

    await refs.controller.approveVault(refs.vault.address)
    await refs.controller.approveStrategy(refs.strategy.address)

    // set vault.strategy
    await refs.vault.setStrategy(refs.strategy.address, new BN(0))
    // fund strategy
    await refs.strategy._mintToPool_(1000)
  })

  return refs
}
