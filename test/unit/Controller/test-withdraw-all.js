const { expect } = require("../../setup");
const { eq, MAX_UINT } = require("../../util");
const setup = require("./setup");

contract("Controller", (accounts) => {
  const refs = setup(accounts);
  const { admin, gasRelayer } = refs;

  let controller;
  let strategy;
  beforeEach(() => {
    controller = refs.controller;
    strategy = refs.strategy;
  });

  describe("withdrawAll", () => {
    it("should withdrawAll admin", async () => {
      await controller.withdrawAll(strategy.address, { from: admin });

      assert(eq(await strategy._withdrawAmount_(), MAX_UINT), "withdraw");
    });

    it("should withdrawAll gas relayer", async () => {
      await controller.withdrawAll(strategy.address, { from: gasRelayer });

      assert(eq(await strategy._withdrawAmount_(), MAX_UINT), "withdraw");
    });

    it("should reject if caller not authorized", async () => {
      await expect(
        controller.withdrawAll(strategy.address, { from: accounts[1] })
      ).to.be.rejectedWith("!authorized");
    });

    it("should reject invalid strategy address", async () => {
      await expect(controller.withdrawAll(accounts[1], { from: admin })).to.be
        .rejected;
    });
  });
});
