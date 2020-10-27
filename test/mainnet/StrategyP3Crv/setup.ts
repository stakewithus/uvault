import BN from "bn.js"
import {sendEther} from "../../util"
import {THREE_CRV, P3CRV_JAR, PICKLE, MASTER_CHEF} from "../config"
import {Refs, StrategyContract} from "./lib"

const IERC20 = artifacts.require("IERC20")
const Controller = artifacts.require("Controller")
const MasterChef = artifacts.require("MasterChef")

export default (
  accounts: Truffle.Accounts,
  params: {
    Strategy: StrategyContract
    underlying: string
    whale: string
  }
) => {
  const {Strategy, underlying, whale} = params

  const admin = accounts[0]
  const vault = accounts[1]
  const treasury = accounts[2]

  before(async () => {
    await sendEther(web3, accounts[0], whale, new BN(1))
  })

  const refs: Refs = {
    admin,
    vault,
    treasury,
    // @ts-ignore
    underlying: null,
    // @ts-ignore
    jar: null,
    // @ts-ignore
    chef: null,
    // @ts-ignore
    pickle: null,
    // @ts-ignore
    threeCrv: null,
    // @ts-ignore
    controller: null,
    // @ts-ignore
    strategy: null,
    whale,
  }

  beforeEach(async () => {
    refs.underlying = await IERC20.at(underlying)
    refs.jar = await IERC20.at(P3CRV_JAR)
    refs.chef = await MasterChef.at(MASTER_CHEF)
    refs.pickle = await IERC20.at(PICKLE)
    refs.threeCrv = await IERC20.at(THREE_CRV)
    refs.controller = await Controller.new(treasury)
    refs.strategy = await Strategy.new(refs.controller.address, vault)
  })

  return refs
}
