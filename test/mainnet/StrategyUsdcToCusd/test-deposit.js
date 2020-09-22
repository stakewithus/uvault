const BN = require("bn.js");

const {
  USDC_ADDRESS,
  USDC_WHALE,
  CUSD_ADDRESS,
  CGAUGE_ADDRESS,
} = require("../../config");
const { eq, sub, frac, USDC_TO_CUSD_DECIMALS } = require("../../util");

const IERC20 = artifacts.require("IERC20");
const Gauge = artifacts.require("Gauge");
const Controller = artifacts.require("Controller");
const StrategyUsdcToCusd = artifacts.require("StrategyUsdcToCusd");

contract("StrategyUsdcToCusd", (accounts) => {
  const admin = accounts[0];
  const vault = accounts[1];
  const treasury = accounts[2];

  before(async () => {
    await web3.eth.sendTransaction({
      to: USDC_WHALE,
      from: accounts[0],
      value: web3.utils.toWei("1", "ether"),
    });
  });

  let usdc;
  let cUsd;
  let cGauge;
  let controller;
  let strategy;
  beforeEach(async () => {
    usdc = await IERC20.at(USDC_ADDRESS);
    cUsd = await IERC20.at(CUSD_ADDRESS);
    cGauge = await Gauge.at(CGAUGE_ADDRESS);
    controller = await Controller.new(treasury);
    strategy = await StrategyUsdcToCusd.new(controller.address, vault);
  });

  it("should deposit", async () => {
    const amount = new BN(10).pow(new BN(6));

    // transfer USDC to vault
    await usdc.transfer(vault, amount, { from: USDC_WHALE });

    // approve strategy to spend USDC from vault
    await usdc.approve(strategy.address, amount, { from: vault });

    const getSnapshot = async () => {
      const snapshot = {
        strategy: {
          underlyingBalance: await strategy.underlyingBalance(),
        },
        usdc: {
          [vault]: await usdc.balanceOf(vault),
          [strategy.address]: await usdc.balanceOf(strategy.address),
        },
        cUsd: {
          [strategy.address]: await cUsd.balanceOf(strategy.address),
        },
        cGauge: {
          [strategy.address]: await cGauge.balanceOf(strategy.address),
        },
      };

      return snapshot;
    };

    const before = await getSnapshot();
    await strategy.deposit(amount, { from: vault });
    const after = await getSnapshot();

    // minimum amount of USDC that can be withdrawn
    const minUsdc = frac(amount, new BN(99), new BN(100));
    // minimum amount of cUsdc minted
    const minCusd = frac(
      amount.mul(USDC_TO_CUSD_DECIMALS),
      new BN(95),
      new BN(100)
    );

    const cUsdDiff = sub(
      after.cGauge[strategy.address],
      before.cGauge[strategy.address]
    );
    const usdcDiff = sub(
      after.strategy.underlyingBalance,
      before.strategy.underlyingBalance
    );

    // USDC transferred from vault to strategy
    assert(
      eq(after.usdc[vault], sub(before.usdc[vault], amount)),
      "usdc vault"
    );

    assert(usdcDiff.gte(minUsdc), "min usdc");
    assert(cUsdDiff.gte(minCusd), "min cUsd");
  });
});
