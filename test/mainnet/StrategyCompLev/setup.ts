import BN from "bn.js"
import { sendEther } from "../../util"
import { Refs, StrategyContract } from "./lib"

const IERC20 = artifacts.require("IERC20")
const Controller = artifacts.require("Controller")

export default (
  accounts: Truffle.Accounts,
  params: {
    Strategy: StrategyContract
    underlying: string
    cToken: string
    whale: string
  }
) => {
  const { Strategy, underlying, cToken, whale } = params

  const admin = accounts[0]
  const vault = accounts[1]
  const treasury = accounts[2]
  const keeper = accounts[3]

  before(async () => {
    await sendEther(web3, accounts[0], whale, new BN(1))
  })

  const refs: Refs = {
    admin,
    vault,
    treasury,
    keeper,
    // @ts-ignore
    underlying: null,
    // @ts-ignore
    cToken: null,
    // @ts-ignore
    controller: null,
    // @ts-ignore
    strategy: null,
    whale,
  }

  beforeEach(async () => {
    refs.underlying = await IERC20.at(underlying)
    refs.cToken = await IERC20.at(cToken)
    refs.controller = await Controller.new(treasury)
    refs.strategy = await Strategy.new(refs.controller.address, vault, cToken, keeper)
  })

  return refs
}
