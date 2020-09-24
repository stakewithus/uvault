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
