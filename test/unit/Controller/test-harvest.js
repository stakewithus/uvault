const { expect } = require("../setup");
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

  describe("harvest", () => {
    it("should harvest", async () => {
      await controller.harvest(strategy.address, { from: admin });

      assert(await strategy._harvestWasCalled_(), "harvest");
    });

    it("should reject if caller not admin", async () => {
      await expect(
        controller.harvest(strategy.address, { from: accounts[1] })
      ).to.be.rejectedWith("!admin");
    });

    it("should reject invalid strategy address", async () => {
      await expect(controller.harvest(accounts[1], { from: admin })).to.be
        .rejected;
    });
  });
});
