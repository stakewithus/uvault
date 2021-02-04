import BN from "bn.js"
import { sendEther } from "../../util"
import { CRV, SBTC_LP, SBTC_GAUGE, STABLE_SWAP_SBTC } from "../config"
import { Refs, StrategyContract } from "./lib"

const IERC20 = artifacts.require("IERC20")
const StableSwapSBTC = artifacts.require("StableSwapSBTC")
const LiquidityGaugeReward = artifacts.require("LiquidityGaugeReward")
const Controller = artifacts.require("Controller")

export default (
  accounts: Truffle.Accounts,
  params: {
    Strategy: StrategyContract
    underlying: string
    whale: string
  }
) => {
  const { Strategy, underlying, whale } = params

  const LP = SBTC_LP
  const GAUGE = SBTC_GAUGE
  const STABLE_SWAP = STABLE_SWAP_SBTC

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
    lp: null,
    // @ts-ignore
    stableSwap: null,
    // @ts-ignore
    gauge: null,
    // @ts-ignore
    crv: null,
    // @ts-ignore
    controller: null,
    // @ts-ignore
    strategy: null,
    whale,
  }

  beforeEach(async () => {
    refs.underlying = await IERC20.at(underlying)
    refs.lp = await IERC20.at(LP)
    refs.stableSwap = await StableSwapSBTC.at(STABLE_SWAP)
    refs.gauge = await LiquidityGaugeReward.at(GAUGE)
    refs.crv = await IERC20.at(CRV)
    refs.controller = await Controller.new(treasury)
    refs.strategy = await Strategy.new(refs.controller.address, vault)
  })

  return refs
}
