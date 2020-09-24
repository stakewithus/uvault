const BN = require("bn.js");

const { USDC, USDC_WHALE, CUSD, CGAUGE, CRV } = require("../../config");
const { sendEther, eq, sub, frac } = require("../../util");
const { getSnapshot } = require("./lib");

const IERC20 = artifacts.require("IERC20");
const Gauge = artifacts.require("Gauge");
const Controller = artifacts.require("Controller");
const StrategyUsdcToCusd = artifacts.require("StrategyUsdcToCusd");

contract("StrategyUsdcToCusd", (accounts) => {
  const vault = accounts[1];
  const treasury = accounts[2];

  before(async () => {
    await sendEther(web3, accounts[0], USDC_WHALE, 1);
  });

  const depositAmount = new BN(10).pow(new BN(6));

  let usdc;
  let cUsd;
  let cGauge;
  let crv;
  let controller;
  let strategy;
  beforeEach(async () => {
    usdc = await IERC20.at(USDC);
    cUsd = await IERC20.at(CUSD);
    cGauge = await Gauge.at(CGAUGE);
    crv = await IERC20.at(CRV);
    controller = await Controller.new(treasury);
    strategy = await StrategyUsdcToCusd.new(controller.address, vault);

    // deposit USDC into vault
    await usdc.transfer(vault, depositAmount, { from: USDC_WHALE });

    // deposit USDC into strategy
    await usdc.approve(strategy.address, depositAmount, { from: vault });
    await strategy.deposit(depositAmount, { from: vault });
  });

  it("should withdraw", async () => {
    const snapshot = getSnapshot({
      usdc,
      cUsd,
      crv,
      cGauge,
      strategy,
      treasury,
      vault,
    });

    // withdraw amount may be < deposit amount
    // so here we get the maximum redeemable amount
    const withdrawAmount = await strategy.underlyingBalance();

    const before = await snapshot();
    await strategy.withdraw(withdrawAmount, { from: vault });
    const after = await snapshot();

    // minimum amount of USDC that can be withdrawn
    const minUsdc = frac(depositAmount, new BN(99), new BN(100));

    // check balance of usdc transferred to treasury and vault
    const fee = sub(after.usdc.treasury, before.usdc.treasury);
    const usdcDiff = sub(after.usdc.vault, before.usdc.vault);

    assert(fee.gte(new BN(0)), "fee");
    assert(usdcDiff.gte(minUsdc), "usdc diff");

    // check strategy does not have any USDC
    assert(eq(after.usdc.strategy, new BN(0)), "usdc strategy");
    // check strategy does not have any cUSD dust
    assert(eq(after.cUsd.strategy, new BN(0)), "cUsd strategy");
  });
});
