const BN = require("bn.js")
const {DAI_WHALE} = require("../../config")
const {eq, sub, frac, DAI_DECIMALS} = require("../../util")
const {getSnapshot} = require("./lib")
const setup = require("./setup")

contract("StrategyDaiToCusdMainnet", (accounts) => {
  const depositAmount = new BN(100).mul(new BN(10).pow(DAI_DECIMALS))

  const refs = setup(accounts)
  const {vault, treasury} = refs

  let dai
  let cUsd
  let cGauge
  let crv
  let controller
  let strategy
  beforeEach(async () => {
    dai = refs.dai
    cUsd = refs.cUsd
    cGauge = refs.cGauge
    crv = refs.crv
    controller = refs.controller
    strategy = refs.strategy

    // deposit dai into vault
    await dai.transfer(vault, depositAmount, {from: DAI_WHALE})

    // deposit dai into strategy
    await dai.approve(strategy.address, depositAmount, {from: vault})
    await strategy.deposit(depositAmount, {from: vault})
  })

  it("should withdraw all", async () => {
    const snapshot = getSnapshot({
      dai,
      cUsd,
      cGauge,
      crv,
      strategy,
      treasury,
      vault,
    })

    const before = await snapshot()
    await strategy.withdrawAll({from: vault})
    const after = await snapshot()

    // minimum amount of dai that can be withdrawn
    const minDai = frac(before.strategy.totalAssets, new BN(99), new BN(100))

    // check balance of dai transferred to treasury and vault
    const daiDiff = sub(after.dai.vault, before.dai.vault)

    assert(daiDiff.gte(minDai), "dai diff")

    // check strategy does not have any dai
    assert(eq(after.dai.strategy, new BN(0)), "dai strategy")
    // check strategy does not have any cUSD dust
    assert(eq(after.cUsd.strategy, new BN(0)), "cUsd strategy")
    // check strategy does not have any cUSD in cGauge
    assert(eq(after.cGauge.strategy, new BN(0)), "cGauge strategy")
  })
})
