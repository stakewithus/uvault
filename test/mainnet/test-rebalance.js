const BN = require("bn.js");
const { encodeInvest, encodeRebalance } = require("./lib");
const setup = require("./setup");

contract("integration", (accounts) => {
  const refs = setup(accounts);
  const { admin, whale, UNDERLYING_DECIMALS } = refs;

  let gasRelayer;
  let gasToken;
  let controller;
  let vault;
  let strategy;
  let underlying;
  beforeEach(async () => {
    gasRelayer = refs.gasRelayer;
    gasToken = refs.gasToken;
    controller = refs.controller;
    vault = refs.vault;
    strategy = refs.strategy;
    underlying = refs.underlying;

    // invest
    const txData = encodeInvest(web3, vault.address);
    await gasRelayer.relayTx(0, controller.address, txData, {
      from: admin,
    });
  });

  it("should rebalance", async () => {
    const snapshot = async () => {
      return {
        underlying: {
          vault: await underlying.balanceOf(vault.address),
          strategy: await underlying.balanceOf(strategy.address),
        },
      };
    };

    const gasTokenBal = await gasToken.balanceOf(gasRelayer.address);
    const txData = encodeRebalance(web3, vault.address);

    // simulate strategy yield
    const yieldAmount = new BN(100).pow(new BN(UNDERLYING_DECIMALS));
    await underlying.transfer(strategy.address, yieldAmount, { from: whale });

    const before = await snapshot();
    await gasRelayer.relayTx(gasTokenBal, controller.address, txData);
    const after = await snapshot();

    // check vault balance increased
    assert(after.underlying.vault.gt(before.underlying.vault), "vault");
    // check strategy balance decreased
    assert(
      after.underlying.strategy.lt(before.underlying.strategy),
      "strategy"
    );
  });
});
