const GasRelayer = artifacts.require("GasRelayer");
const MockGasToken = artifacts.require("MockGasToken");
const TxReceiver = artifacts.require("TxReceiver");

module.exports = (accounts) => {
  const admin = accounts[0];

  // references to return
  const refs = {
    admin,
    gasToken: null,
    gasRelayer: null,
    txReceiver: null,
  };

  beforeEach(async () => {
    refs.gasToken = await MockGasToken.new();
    refs.gasRelayer = await GasRelayer.new(refs.gasToken.address, {
      from: admin,
    });
    refs.txReceiver = await TxReceiver.new();
  });

  return refs;
};
