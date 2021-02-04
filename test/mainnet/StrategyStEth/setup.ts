import { CRV, STETH_LP, STABLE_SWAP_STETH, STETH_GAUGE } from "../config"
import { Refs } from "./lib"

const IERC20 = artifacts.require("IERC20")
const StableSwapSTETH = artifacts.require("StableSwapSTETH")
const LiquidityGaugeV2 = artifacts.require("LiquidityGaugeV2")
const Controller = artifacts.require("Controller")
const StrategyStEth = artifacts.require("StrategyStEth")

export default (accounts: Truffle.Accounts) => {
  const LP = STETH_LP
  const GAUGE = STETH_GAUGE
  const STABLE_SWAP = STABLE_SWAP_STETH

  const admin = accounts[0]
  const vault = accounts[1]
  const treasury = accounts[2]

  const refs: Refs = {
    web3,
    admin,
    vault,
    treasury,
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
  }

  beforeEach(async () => {
    refs.lp = await IERC20.at(LP)
    refs.stableSwap = await StableSwapSTETH.at(STABLE_SWAP)
    refs.gauge = await LiquidityGaugeV2.at(GAUGE)
    refs.crv = await IERC20.at(CRV)
    refs.controller = await Controller.new(treasury)
    refs.strategy = await StrategyStEth.new(refs.controller.address, vault)
  })

  return refs
}
