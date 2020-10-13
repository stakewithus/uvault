const BN = require("bn.js")
const {DAI_WHALE} = require("../../config")
const {eq, sub, frac, DAI_DECIMALS, DAI_TO_CUSD_DECIMALS} = require("../../util")
const {getSnapshot} = require("./lib")
const setup = require("./setup")

contract("StrategyDaiToCusdMainnet", (accounts) => {
  const refs = setup(accounts)
  const {vault, treasury} = refs

  let dai
  let cUsd
  let cGauge
  let crv
  let controller
  let strategy
  beforeEach(() => {
    dai = refs.dai
    cUsd = refs.cUsd
    cGauge = refs.cGauge
    crv = refs.crv
    controller = refs.controller
    strategy = refs.strategy
  })

  it("should deposit", async () => {
    const amount = new BN(10).pow(DAI_DECIMALS)

    // transfer dai to vault
    await dai.transfer(vault, amount, {from: DAI_WHALE})

    // approve strategy to spend dai from vault
    await dai.approve(strategy.address, amount, {from: vault})

    const snapshot = getSnapshot({
      dai,
      cUsd,
      cGauge,
      crv,
      strategy,
      vault,
      treasury,
    })

    const before = await snapshot()
    await strategy.deposit(amount, {from: vault})
    const after = await snapshot()

    // minimum amount of dai that can be withdrawn
    const minDai = frac(amount, new BN(99), new BN(100))
    // minimum amount of cUsd minted
    const minCusd = frac(amount.mul(DAI_TO_CUSD_DECIMALS), new BN(95), new BN(100))

    const cUsdDiff = sub(after.cGauge.strategy, before.cGauge.strategy)
    const daiDiff = sub(after.strategy.totalAssets, before.strategy.totalAssets)

    // dai transferred from vault to strategy
    assert(eq(after.dai.vault, sub(before.dai.vault, amount)), "dai vault")
    assert(daiDiff.gte(minDai), "min dai")
    assert(cUsdDiff.gte(minCusd), "min cUsd")
  })
})
