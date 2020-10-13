const BN = require("bn.js")
const {USDC_WHALE} = require("../../config")
const {eq, sub, frac, USDC_DECIMALS} = require("../../util")
const {getSnapshot} = require("./lib")
const setup = require("./setup")

contract("StrategyUsdcToCusdMainnet", (accounts) => {
  const depositAmount = new BN(100).mul(new BN(10).pow(USDC_DECIMALS))

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

  it("should withdraw all", async () => {
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
    await strategy.withdrawAll({from: vault})
    const after = await snapshot()

    // minimum amount of USDC that can be withdrawn
    const minUsdc = frac(before.strategy.totalAssets, new BN(99), new BN(100))

    // check balance of usdc transferred to treasury and vault
    const usdcDiff = sub(after.usdc.vault, before.usdc.vault)

    assert(usdcDiff.gte(minUsdc), "usdc diff")

    // check strategy does not have any USDC
    assert(eq(after.usdc.strategy, new BN(0)), "usdc strategy")
    // check strategy does not have any cUSD dust
    assert(eq(after.cUsd.strategy, new BN(0)), "cUsd strategy")
    // check strategy does not have any cUSD in cGauge
    assert(eq(after.cGauge.strategy, new BN(0)), "cGauge strategy")
  })
})