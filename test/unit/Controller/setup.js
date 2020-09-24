const Controller = artifacts.require("Controller");
const MockStrategy = artifacts.require("MockStrategy");

module.exports = (accounts) => {
  const admin = accounts[0];
  const treasury = accounts[1];
  // mock contract addresses
  const vault = accounts[2];
  const underlyingToken = accounts[3];

  // references to return
  const refs = {
    admin,
    treasury,
    vault,
    underlyingToken,
    controller: null,
    strategy: null,
  };

  beforeEach(async () => {
    refs.controller = await Controller.new(treasury, { from: admin });
    refs.strategy = await MockStrategy.new(
      refs.controller.address,
      vault,
      underlyingToken
    );
  });

  return refs;
};
