const ERC20Token = artifacts.require("ERC20Token");
const Vault = artifacts.require("Vault");
const MockStrategy = artifacts.require("MockStrategy");

module.exports = (accounts, minWaitTime = 0) => {
  const admin = accounts[0];
  // mock controller address
  const controller = accounts[1];

  // references to return
  const refs = {
    erc20: null,
    vault: null,
    admin,
    controller,
    strategy: null,
  };

  before(async () => {
    refs.erc20 = await ERC20Token.new();
  });

  beforeEach(async () => {
    refs.vault = await Vault.new(
      controller,
      refs.erc20.address,
      "vault",
      "vault",
      minWaitTime
    );

    refs.strategy = await MockStrategy.new(
      controller,
      refs.vault.address,
      refs.erc20.address,
      { from: admin }
    );
  });

  return refs;
};
