import BN from "bn.js"
import { sendEther } from "../../util"
import {
  PDAI_JAR,
  PICKLE,
  MASTER_CHEF,
  PICKLE_STAKING,
  DAI,
  DAI_WHALE,
} from "../config"
import { Refs } from "./lib"

const IERC20 = artifacts.require("IERC20")
const MasterChef = artifacts.require("MasterChef")
const PickleStaking = artifacts.require("PickleStaking")
const StrategyPdaiDai = artifacts.require("StrategyPdaiDai")
const Controller = artifacts.require("Controller")

export default (accounts: Truffle.Accounts) => {
  const admin = accounts[0]
  const vault = accounts[1]
  const treasury = accounts[2]

  before(async () => {
    await sendEther(web3, accounts[0], DAI_WHALE, new BN(1))
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
    staking: null,
    // @ts-ignore
    controller: null,
    // @ts-ignore
    strategy: null,
    whale: DAI_WHALE,
  }

  beforeEach(async () => {
    refs.underlying = await IERC20.at(DAI)
    refs.jar = await IERC20.at(PDAI_JAR)
    refs.chef = await MasterChef.at(MASTER_CHEF)
    refs.pickle = await IERC20.at(PICKLE)
    refs.staking = await PickleStaking.at(PICKLE_STAKING)
    refs.controller = await Controller.new(treasury)
    refs.strategy = await StrategyPdaiDai.new(refs.controller.address, vault)
  })

  return refs
}
