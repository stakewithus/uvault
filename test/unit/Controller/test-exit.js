const { expect } = require("../../setup");
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

  describe("exit", () => {
    it("should exit admin", async () => {
      await controller.exit(strategy.address, { from: admin });

      assert(await strategy._exitWasCalled_(), "exit");
    });

    it("should exit gas relayer", async () => {
      await controller.exit(strategy.address, { from: gasRelayer });

      assert(await strategy._exitWasCalled_(), "exit");
    });

    it("should reject if caller not authorized", async () => {
      await expect(
        controller.exit(strategy.address, { from: accounts[1] })
      ).to.be.rejectedWith("!authorized");
    });

    it("should reject invalid strategy address", async () => {
      await expect(controller.exit(accounts[1], { from: admin })).to.be
        .rejected;
    });
  });
});
