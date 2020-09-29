const BN = require("bn.js")
const {USDC_WHALE} = require("../../config")
const {eq, sub, frac} = require("../../util")
const {getSnapshot} = require("./lib")
const setup = require("./setup")

contract("StrategyUsdcToCusd", (accounts) => {
  const depositAmount = new BN(10).pow(new BN(6))

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

  it("should withdraw", async () => {
    const snapshot = getSnapshot({
      usdc,
      cUsd,
      crv,
      cGauge,
      strategy,
      treasury,
      vault,
    })

    // withdraw amount may be < deposit amount
    // so here we get the maximum redeemable amount
    const withdrawAmount = await strategy.underlyingBalance()

    const before = await snapshot()
    await strategy.withdraw(withdrawAmount, {from: vault})
    const after = await snapshot()

    // minimum amount of USDC that can be withdrawn
    const minUsdc = frac(depositAmount, new BN(99), new BN(100))

    // check balance of usdc transferred to treasury and vault
    const fee = sub(after.usdc.treasury, before.usdc.treasury)
    const usdcDiff = sub(after.usdc.vault, before.usdc.vault)

    assert(fee.gte(new BN(0)), "fee")
    assert(usdcDiff.gte(minUsdc), "usdc diff")

    // check strategy does not have any USDC
    assert(eq(after.usdc.strategy, new BN(0)), "usdc strategy")
    // check strategy does not have any cUSD dust
    assert(eq(after.cUsd.strategy, new BN(0)), "cUsd strategy")
  })
})
