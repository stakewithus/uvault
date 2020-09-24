const { expect } = require("../setup");
const { eq, MAX_UINT } = require("../../util");

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

  describe("withdrawAll", () => {
    it("should withdrawAll", async () => {
      await controller.withdrawAll(strategy.address, { from: admin });

      assert(eq(await strategy._getWithdrawAmount_(), MAX_UINT), "withdraw");
    });

    it("should reject if caller not admin", async () => {
      await expect(
        controller.withdrawAll(strategy.address, { from: accounts[1] })
      ).to.be.rejectedWith("!admin");
    });

    it("should reject invalid strategy address", async () => {
      await expect(controller.withdrawAll(accounts[1], { from: admin })).to.be
        .rejected;
    });
  });
});
