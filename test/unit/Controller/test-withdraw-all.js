const { expect } = require("../setup");
const { eq, MAX_UINT } = require("../../util");
const setup = require("./setup");

contract("Controller", (accounts) => {
  const refs = setup(accounts);
  const { admin } = refs;

  let controller;
  let strategy;
  beforeEach(() => {
    controller = refs.controller;
    strategy = refs.strategy;
  });

  describe("withdrawAll", () => {
    it("should withdrawAll", async () => {
      await controller.withdrawAll(strategy.address, { from: admin });

      assert(eq(await strategy._withdrawAmount_(), MAX_UINT), "withdraw");
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
