const BN = require("bn.js")
const {DAI_WHALE} = require("../../config")
const {DAI_DECIMALS} = require('../../util')
const {getSnapshot} = require("./lib")
const setup = require("./setup")

contract("StrategyDaiToCusdMainnet", (accounts) => {
  const depositAmount = new BN(100).mul(new BN(10).pow(DAI_DECIMALS))

  const refs = setup(accounts)
  const {admin, vault, treasury} = refs

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

  it("should harvest", async () => {
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
    // only controller can call harvest
    await controller.harvest(strategy.address, {from: admin})
    const after = await snapshot()

    assert(after.dai.treasury.gte(before.dai.treasury), "dai treasury")
    assert(
      after.strategy.totalAssets.gte(before.strategy.totalAssets),
      "strategy underlying balance"
    )
    assert(after.cGauge.strategy.gte(before.cGauge.strategy), "cGauge strategy")
    assert(after.crv.strategy.gte(before.crv.strategy), "crv strategy")
  })
})
