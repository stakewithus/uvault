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

  describe("harvest", () => {
    it("should harvest admin", async () => {
      await controller.harvest(strategy.address, { from: admin });

      assert(await strategy._harvestWasCalled_(), "harvest");
    });

    it("should harvest gas relayer", async () => {
      await controller.harvest(strategy.address, { from: gasRelayer });

      assert(await strategy._harvestWasCalled_(), "harvest");
    });

    it("should reject if caller not authorized", async () => {
      await expect(
        controller.harvest(strategy.address, { from: accounts[1] })
      ).to.be.rejectedWith("!authorized");
    });

    it("should reject invalid strategy address", async () => {
      await expect(controller.harvest(accounts[1], { from: admin })).to.be
        .rejected;
    });
  });
});
