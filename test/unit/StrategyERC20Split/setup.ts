import "../../setup"
import {
  TestTokenInstance,
  MockControllerInstance,
  StrategyERC20SplitInstance,
  StrategyERC20V3TestInstance,
} from "../../../types"

const TestToken = artifacts.require("TestToken")
const MockController = artifacts.require("MockController")
const StrategyERC20Split = artifacts.require("StrategyERC20Split")
const StrategyERC20_V3_Test = artifacts.require("StrategyERC20_V3_Test")

export default (accounts: Truffle.Accounts) => {
  const admin = accounts[0]
  const treasury = accounts[1]
  const vault = accounts[2]
  const timeLock = accounts[3]
  const keeper = accounts[4]

  // references to return
  interface Refs {
    admin: string
    treasury: string
    underlying: TestTokenInstance
    controller: MockControllerInstance
    vault: string
    timeLock: string
    keeper: string
    split: StrategyERC20SplitInstance
    strategies: StrategyERC20V3TestInstance[]
  }

  const refs: Refs = {
    admin,
    treasury,
    // @ts-ignore
    underlying: null,
    // @ts-ignore
    controller: null,
    vault,
    timeLock,
    keeper,
    // @ts-ignore
    split: null,
    strategies: [],
  }

  beforeEach(async () => {
    const underlying = await TestToken.new()
    const controller = await MockController.new(treasury)
    const split = await StrategyERC20Split.new(
      controller.address,
      vault,
      underlying.address,
      timeLock,
      keeper,
      {
        from: admin,
      }
    )

    const strategies = []
    // NOTE: i should be >= 3 for testing setActiveStrategies
    for (let i = 0; i < 3; i++) {
      strategies.push(
        await StrategyERC20_V3_Test.new(
          controller.address,
          split.address,
          underlying.address,
          keeper,
          { from: admin }
        )
      )
    }

    for (const strategy of strategies) {
      await split.approveStrategy(strategy.address, { from: timeLock })
      await split.activateStrategy(strategy.address, 100, { from: admin })
    }

    refs.underlying = underlying
    refs.controller = controller
    refs.split = split
    refs.strategies = strategies
  })

  return refs
}
