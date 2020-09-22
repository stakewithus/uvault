const BN = require("bn.js");

const {
  USDC_ADDRESS,
  USDC_WHALE,
  CUSD_ADDRESS,
  CGAUGE_ADDRESS,
  CRV_ADDRESS,
} = require("../../config");
const {
  sendEther,
  eq,
  sub,
  frac,
  USDC_TO_CUSD_DECIMALS,
} = require("../../util");
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
    usdc = await IERC20.at(USDC_ADDRESS);
    cUsd = await IERC20.at(CUSD_ADDRESS);
    cGauge = await Gauge.at(CGAUGE_ADDRESS);
    crv = await IERC20.at(CRV_ADDRESS);
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

  it("should withdraw", async () => {
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
    await strategy.harvest({ from: admin });
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
