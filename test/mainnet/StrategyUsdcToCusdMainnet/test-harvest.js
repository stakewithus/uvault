const BN = require("bn.js")
const {USDC_WHALE} = require("../../config")
const {USDC_DECIMALS} = require("../../util")
const {getSnapshot} = require("./lib")
const setup = require("./setup")

contract("StrategyUsdcToCusdMainnet", (accounts) => {
  const depositAmount = new BN(100).mul(new BN(10).pow(USDC_DECIMALS))

  const refs = setup(accounts)
  const {admin, vault, treasury} = refs

  let usdc
  let cUsd
  let cGauge
  let crv
  let controller
  let strategy
  beforeEach(async () => {
    usdc = refs.usdc
    cUsd = refs.cUsd
    cGauge = refs.cGauge
    crv = refs.crv
    controller = refs.controller
    strategy = refs.strategy

    // deposit USDC into vault
    await usdc.transfer(vault, depositAmount, {from: USDC_WHALE})

    // deposit USDC into strategy
    await usdc.approve(strategy.address, depositAmount, {from: vault})
    await strategy.deposit(depositAmount, {from: vault})
  })

  it("should harvest", async () => {
    const snapshot = getSnapshot({
      usdc,
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

    assert(after.usdc.treasury.gte(before.usdc.treasury), "usdc treasury")
    assert(
      after.strategy.totalAssets.gte(before.strategy.totalAssets),
      "strategy underlying balance"
    )
    assert(after.cGauge.strategy.gte(before.cGauge.strategy), "cGauge strategy")
    assert(after.crv.strategy.gte(before.crv.strategy), "crv strategy")
  })
})
