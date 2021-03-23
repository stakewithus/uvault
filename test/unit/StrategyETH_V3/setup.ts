import "../../setup"
import { MockControllerInstance, StrategyETHV3TestInstance } from "../../../types"

const MockController = artifacts.require("MockController")
const StrategyETH_V3_Test = artifacts.require("StrategyETH_V3_Test")

export default (accounts: Truffle.Accounts) => {
  const admin = accounts[0]
  const treasury = accounts[1]
  const keeper = accounts[2]
  const vault = accounts[3]

  // references to return
  interface Refs {
    admin: string
    treasury: string
    controller: MockControllerInstance
    keeper: string
    vault: string
    strategy: StrategyETHV3TestInstance
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
    refs.controller = await MockController.new(treasury)
    refs.strategy = await StrategyETH_V3_Test.new(
      refs.controller.address,
      vault,
      keeper,
      { from: admin }
    )
  })

  return refs
}
