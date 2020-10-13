const BN = require("bn.js")
const {USDC_WHALE} = require("../../config")
const {eq} = require("../../util")
const {getSnapshot} = require("./lib")
const setup = require("./setup")

contract("StrategyUsdcToCusdMainnet", (accounts) => {
  const depositAmount = new BN(100).mul(new BN(10).pow(new BN(6)))

  const refs = setup(accounts)
  const {vault, treasury} = refs

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

  it("should exit", async () => {
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
    await strategy.exit({from: vault})
    const after = await snapshot()

    assert(eq(after.strategy.totalAssets, new BN(0)), "strategy underlying balance")
    assert(eq(after.cGauge.strategy, new BN(0)), "cGauge strategy")
    assert(eq(after.cUsd.strategy, new BN(0)), "cUsd strategy")
    assert(eq(after.usdc.strategy, new BN(0)), "usdc strategy")
    assert(eq(after.crv.strategy, new BN(0)), "crv strategy")
    assert(after.usdc.vault.gte(before.usdc.vault), "usdc vault")
  })
})
