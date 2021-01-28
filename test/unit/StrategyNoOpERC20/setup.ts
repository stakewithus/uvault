import "../../setup"
import { StrategyNoOpERC20Instance, TestTokenInstance } from "../../../types"

const TestToken = artifacts.require("TestToken")
const StrategyNoOpERC20 = artifacts.require("StrategyNoOpERC20")

export default (accounts: Truffle.Accounts) => {
  const admin = accounts[0]
  // mock contract addresses
  const controller = accounts[1]
  const vault = accounts[2]

  interface Refs {
    admin: string
    vault: string
    strategy: StrategyNoOpERC20Instance
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
    refs.strategy = await StrategyNoOpERC20.new(
      controller,
      vault,
      refs.underlying.address
    )
  })

  return refs
}
