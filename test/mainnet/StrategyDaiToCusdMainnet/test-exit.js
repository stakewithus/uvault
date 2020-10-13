const BN = require("bn.js")
const {DAI_WHALE} = require("../../config")
const {eq, DAI_DECIMALS} = require("../../util")
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

  it("should exit", async () => {
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
    await strategy.exit({from: vault})
    const after = await snapshot()

    assert(eq(after.strategy.totalAssets, new BN(0)), "strategy underlying balance")
    assert(eq(after.cGauge.strategy, new BN(0)), "cGauge strategy")
    assert(eq(after.cUsd.strategy, new BN(0)), "cUsd strategy")
    assert(eq(after.dai.strategy, new BN(0)), "dai strategy")
    assert(eq(after.crv.strategy, new BN(0)), "crv strategy")
    assert(after.dai.vault.gte(before.dai.vault), "dai vault")
  })
})
