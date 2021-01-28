import "../../setup"
import { MockControllerInstance, StrategyETHTestInstance } from "../../../types"

const MockController = artifacts.require("MockController")
const StrategyETHTest = artifacts.require("StrategyETHTest")

export default (accounts: Truffle.Accounts) => {
  const admin = accounts[0]
  const treasury = accounts[1]

  const vault = accounts[2]

  // references to return
  interface Refs {
    admin: string
    treasury: string
    controller: MockControllerInstance
    vault: string
    strategy: StrategyETHTestInstance
  }

  const refs: Refs = {
    admin,
    treasury,
    // @ts-ignore
    controller: null,
    vault,
    // @ts-ignore
    strategy: null,
  }

  beforeEach(async () => {
    refs.controller = await MockController.new(treasury)
    refs.strategy = await StrategyETHTest.new(refs.controller.address, vault, {
      from: admin,
    })
  })

  return refs
}
