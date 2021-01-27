import "../../setup"
import {
  TestTokenInstance,
  MockControllerInstance,
  StrategyERC20TestInstance,
} from "../../../types"

const TestToken = artifacts.require("TestToken")
const MockController = artifacts.require("MockController")
const StrategyERC20Test = artifacts.require("StrategyERC20Test")

export default (accounts: Truffle.Accounts) => {
  const admin = accounts[0]
  const treasury = accounts[1]

  const vault = accounts[2]

  // references to return
  interface Refs {
    admin: string
    treasury: string
    underlying: TestTokenInstance
    controller: MockControllerInstance
    vault: string
    strategy: StrategyERC20TestInstance
  }

  const refs: Refs = {
    admin,
    treasury,
    // @ts-ignore
    underlying: null,
    // @ts-ignore
    controller: null,
    vault,
    // @ts-ignore
    strategy: null,
  }

  beforeEach(async () => {
    refs.underlying = await TestToken.new()
    refs.controller = await MockController.new(treasury)
    refs.strategy = await StrategyERC20Test.new(
      refs.controller.address,
      vault,
      refs.underlying.address,
      { from: admin }
    )
  })

  return refs
}
