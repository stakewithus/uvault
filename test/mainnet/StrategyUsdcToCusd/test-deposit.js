const BN = require("bn.js");
const { USDC_WHALE } = require("../../config");
const { eq, sub, frac, USDC_TO_CUSD_DECIMALS } = require("../../util");
const { getSnapshot } = require("./lib");
const setup = require("./setup");

contract("StrategyUsdcToCusd", (accounts) => {
  const refs = setup(accounts);
  const { vault, treasury } = refs;

  let usdc;
  let cUsd;
  let cGauge;
  let crv;
  let controller;
  let strategy;
  beforeEach(() => {
    usdc = refs.usdc;
    cUsd = refs.cUsd;
    cGauge = refs.cGauge;
    crv = refs.crv;
    controller = refs.controller;
    strategy = refs.strategy;
  });

  it("should deposit", async () => {
    const amount = new BN(10).pow(new BN(6));

    // transfer USDC to vault
    await usdc.transfer(vault, amount, { from: USDC_WHALE });

    // approve strategy to spend USDC from vault
    await usdc.approve(strategy.address, amount, { from: vault });

    const snapshot = getSnapshot({
      usdc,
      cUsd,
      cGauge,
      crv,
      strategy,
      vault,
      treasury,
    });

    const before = await snapshot();
    await strategy.deposit(amount, { from: vault });
    const after = await snapshot();

    // minimum amount of USDC that can be withdrawn
    const minUsdc = frac(amount, new BN(99), new BN(100));
    // minimum amount of cUsdc minted
    const minCusd = frac(
      amount.mul(USDC_TO_CUSD_DECIMALS),
      new BN(95),
      new BN(100)
    );

    const cUsdDiff = sub(after.cGauge.strategy, before.cGauge.strategy);
    const usdcDiff = sub(
      after.strategy.underlyingBalance,
      before.strategy.underlyingBalance
    );

    // USDC transferred from vault to strategy
    assert(eq(after.usdc.vault, sub(before.usdc.vault, amount)), "usdc vault");

    assert(usdcDiff.gte(minUsdc), "min usdc");
    assert(cUsdDiff.gte(minCusd), "min cUsd");
  });
});
