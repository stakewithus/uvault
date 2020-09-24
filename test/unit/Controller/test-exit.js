const { expect } = require("../setup");

const Controller = artifacts.require("Controller");
const MockStrategy = artifacts.require("MockStrategy");

contract("Controller", (accounts) => {
  const admin = accounts[0];
  const treasury = accounts[1];
  // mock contract addresses
  const vault = accounts[2];
  const underlyingToken = accounts[3];

  let controller;
  let strategy;
  beforeEach(async () => {
    controller = await Controller.new(treasury, { from: admin });
    strategy = await MockStrategy.new(
      controller.address,
      vault,
      underlyingToken
    );
  });

  describe("exit", () => {
    it("should exit", async () => {
      await controller.exit(strategy.address, { from: admin });

      assert(await strategy._wasExitCalled_(), "exit");
    });

    it("should reject if caller not admin", async () => {
      await expect(
        controller.exit(strategy.address, { from: accounts[1] })
      ).to.be.rejectedWith("!admin");
    });

    it("should reject invalid strategy address", async () => {
      await expect(controller.exit(accounts[1], { from: admin })).to.be
        .rejected;
    });
  });
});
