import "../../setup"
import { StrategyNoOpETHInstance } from "../../../types"

const StrategyNoOpETH = artifacts.require("StrategyNoOpETH")

export default (accounts: Truffle.Accounts) => {
  const admin = accounts[0]
  // mock contract addresses
  const controller = accounts[1]
  const vault = accounts[2]

  interface Refs {
    admin: string
    vault: string
    strategy: StrategyNoOpETHInstance
  }

  const refs: Refs = {
    admin,
    vault,
    // @ts-ignore
    strategy: null,
  }

  beforeEach(async () => {
    refs.strategy = await StrategyNoOpETH.new(controller, vault)
  })

  return refs
}
