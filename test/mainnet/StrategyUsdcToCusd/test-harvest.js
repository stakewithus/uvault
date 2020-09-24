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

  it("should harvest", async () => {
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
    // only controller can call harvest
    await controller.harvest(strategy.address, { from: admin });
    const after = await snapshot();

    assert(after.usdc.treasury.gte(before.usdc.treasury), "usdc treasury");
    assert(
      after.strategy.underlyingBalance.gte(before.strategy.underlyingBalance),
      "strategy underlying balance"
    );
    assert(
      after.cGauge.strategy.gte(before.cGauge.strategy),
      "cGauge strategy"
    );
    assert(after.crv.strategy.gte(before.crv.strategy), "crv strategy");
  });
});
