import BN from "bn.js"
import { sendEther } from "../../util"
import { CRV, DAI_USDC_USDT_AAVE, AAVE_GAUGE } from "../config"
import { Refs, StrategyContract } from "./lib"

const IERC20 = artifacts.require("IERC20")
const LiquidityGaugeV2 = artifacts.require("LiquidityGaugeV2")
const ControllerV2 = artifacts.require("ControllerV2")

export default (
  accounts: Truffle.Accounts,
  params: {
    Strategy: StrategyContract
    underlying: string
    whale: string
  }
) => {
  const { Strategy, underlying, whale } = params

  const LP = DAI_USDC_USDT_AAVE
  const GAUGE = AAVE_GAUGE

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
    refs.gauge = await LiquidityGaugeV2.at(GAUGE)
    refs.crv = await IERC20.at(CRV)
    refs.controller = await ControllerV2.new(treasury)
    refs.strategy = await Strategy.new(refs.controller.address, vault)
  })

  return refs
}
