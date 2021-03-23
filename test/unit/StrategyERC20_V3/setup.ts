import "../../setup"
import {
  TestTokenInstance,
  MockControllerInstance,
  StrategyERC20V3TestInstance,
} from "../../../types"

const TestToken = artifacts.require("TestToken")
const MockController = artifacts.require("MockController")
const StrategyERC20_V3_Test = artifacts.require("StrategyERC20_V3_Test")

export default (accounts: Truffle.Accounts) => {
  const admin = accounts[0]
  const treasury = accounts[1]
  const keeper = accounts[2]
  const vault = accounts[3]

  // references to return
  interface Refs {
    admin: string
    treasury: string
    underlying: TestTokenInstance
    controller: MockControllerInstance
    keeper: string
    vault: string
    strategy: StrategyERC20V3TestInstance
  }

  const refs: Refs = {
    admin,
    treasury,
    // @ts-ignore
    underlying: null,
    // @ts-ignore
    controller: null,
    keeper,
    vault,
    // @ts-ignore
    strategy: null,
  }

  beforeEach(async () => {
    refs.underlying = await TestToken.new()
    refs.controller = await MockController.new(treasury)
    refs.strategy = await StrategyERC20_V3_Test.new(
      refs.controller.address,
      vault,
      refs.underlying.address,
      keeper,
      { from: admin }
    )
  })

  return refs
}
