const BN = require("bn.js");
const { USDC, USDC_WHALE, CHI } = require("../config");
const { sendEther, MAX_UINT } = require("../util");
const { assert } = require("chai");

const IERC20 = artifacts.require("IERC20");
const GasToken = artifacts.require("GasToken");
const GasRelayer = artifacts.require("GasRelayer");
const Controller = artifacts.require("Controller");
const Vault = artifacts.require("Vault");
const StrategyMainnetTest = artifacts.require("StrategyMainnetTest");

module.exports = (accounts) => {
  const admin = accounts[0];
  const treasury = accounts[1];

  const whale = USDC_WHALE;
  const MIN_WAIT_TIME = 0;

  // references to return
  const refs = {
    admin,
    treasury,
    gasToken: null,
    gasRelayer: null,
    contoller: null,
    vault: null,
    strategy: null,
    underlying: null,
    whale,
    MIN_WAIT_TIME,
  };

  before(async () => {
    // fund whale with Ether
    await sendEther(web3, accounts[0], whale, 1);
  });

  beforeEach(async () => {
    const gasToken = await GasToken.at(CHI);
    const gasRelayer = await GasRelayer.new(gasToken.address, {
      from: admin,
    });
    const controller = await Controller.new(treasury, gasRelayer.address, {
      from: admin,
    });
    const vault = await Vault.new(
      controller.address,
      USDC,
      "vault",
      "vault",
      MIN_WAIT_TIME,
      {
        from: admin,
      }
    );
    const strategy = await StrategyMainnetTest.new(
      controller.address,
      vault.address,
      USDC,
      {
        from: admin,
      }
    );
    const underlying = await IERC20.at(USDC);

    refs.gasToken = gasToken;
    refs.gasRelayer = gasRelayer;
    refs.controller = controller;
    refs.vault = vault;
    refs.strategy = strategy;
    refs.underlying = underlying;

    // Mint gas token
    await gasRelayer.mintGasToken(10);

    // set strategy
    await vault.setNextStrategy(strategy.address, { from: admin });
    await controller.switchStrategy(vault.address, { from: admin });

    // deposit into vault
    const bal = await underlying.balanceOf(whale);
    assert(bal.gt(new BN(0)), "whale balanace = 0");

    await underlying.approve(vault.address, bal, { from: whale });
    await vault.deposit(bal, { from: whale });
  });

  return refs;
};
