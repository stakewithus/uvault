const BN = require("bn.js");

const { USDC, USDC_WHALE, CUSD, CGAUGE, CRV } = require("../../config");
const { sendEther, eq, sub, frac } = require("../../util");
const { getSnapshot } = require("./lib");

const IERC20 = artifacts.require("IERC20");
const Gauge = artifacts.require("Gauge");
const Controller = artifacts.require("Controller");
const StrategyUsdcToCusd = artifacts.require("StrategyUsdcToCusd");

contract("StrategyUsdcToCusd", (accounts) => {
  const admin = accounts[0];
  const vault = accounts[1];
  const treasury = accounts[2];

  before(async () => {
    await sendEther(web3, accounts[0], USDC_WHALE, 1);
  });

  const depositAmount = new BN(100).mul(new BN(10).pow(new BN(6)));

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
    strategy = await StrategyUsdcToCusd.new(controller.address, vault, {
      from: admin,
    });

    // deposit USDC into vault
    await usdc.transfer(vault, depositAmount, { from: USDC_WHALE });

    // deposit USDC into strategy
    await usdc.approve(strategy.address, depositAmount, { from: vault });
    await strategy.deposit(depositAmount, { from: vault });
  });

  it("should exit", async () => {
    const snapshot = getSnapshot({
      usdc,
      cUsd,
      cGauge,
      crv,
      strategy,
      treasury,
      vault,
    });

    const before = await snapshot();
    await strategy.exit({ from: vault });
    const after = await snapshot();

    assert(
      eq(after.strategy.underlyingBalance, new BN(0)),
      "strategy underlying balance"
    );
    assert(eq(after.cGauge.strategy, new BN(0)), "cGauge strategy");
    assert(eq(after.cUsd.strategy, new BN(0)), "cUsd strategy");
    assert(eq(after.usdc.strategy, new BN(0)), "usdc strategy");
    assert(eq(after.crv.strategy, new BN(0)), "crv strategy");
    assert(after.usdc.vault.gte(before.usdc.vault), "usdc vault");
  });
});
