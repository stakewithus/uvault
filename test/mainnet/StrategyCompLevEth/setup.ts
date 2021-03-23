import { CETH } from "../config"
import { Refs } from "./lib"

const IERC20 = artifacts.require("IERC20")
const Controller = artifacts.require("Controller")
const StrategyCompLevEth = artifacts.require("StrategyCompLevEth")

export default (accounts: Truffle.Accounts) => {
  const admin = accounts[0]
  const vault = accounts[1]
  const treasury = accounts[2]
  const keeper = accounts[3]

  const refs: Refs = {
    web3,
    admin,
    vault,
    treasury,
    keeper,
    // @ts-ignore
    cToken: null,
    // @ts-ignore
    controller: null,
    // @ts-ignore
    strategy: null,
  }

  beforeEach(async () => {
    refs.cToken = await IERC20.at(CETH)
    refs.controller = await Controller.new(treasury)
    refs.strategy = await StrategyCompLevEth.new(
      refs.controller.address,
      vault,
      CETH,
      keeper
    )
  })

  return refs
}
