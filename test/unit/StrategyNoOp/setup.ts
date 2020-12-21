import "../../setup"
import { StrategyNoOpInstance, TestTokenInstance } from "../../../types"

const TestToken = artifacts.require("TestToken")
const StrategyNoOp = artifacts.require("StrategyNoOp")

export default (accounts: Truffle.Accounts) => {
  const admin = accounts[0]
  // mock contract addresses
  const controller = accounts[1]
  const vault = accounts[2]

  interface Refs {
    admin: string
    vault: string
    strategy: StrategyNoOpInstance
    underlying: TestTokenInstance
  }

  const refs: Refs = {
    admin,
    vault,
    // @ts-ignore
    strategy: null,
    // @ts-ignore
    underlying: null,
  }

  beforeEach(async () => {
    refs.underlying = await TestToken.new()
    refs.strategy = await StrategyNoOp.new(controller, vault, refs.underlying.address)
  })

  return refs
}
