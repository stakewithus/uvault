const { expect } = require("../setup");
const setup = require("./setup");

contract("Controller", (accounts) => {
  const refs = setup(accounts);
  const { admin, gasRelayer } = refs;

  let controller;
  let vault;
  beforeEach(() => {
    controller = refs.controller;
    vault = refs.vault;
  });

  describe("switchStrategy", () => {
    it("should switch strategy admin", async () => {
      await controller.switchStrategy(vault.address, { from: admin });

      assert(await vault._switchStrategyWasCalled_(), "switch strategy");
    });

    it("should switch strategy gas relayer", async () => {
      await controller.switchStrategy(vault.address, { from: gasRelayer });

      assert(await vault._switchStrategyWasCalled_(), "switch strategy");
    });

    it("should reject if caller not authorized", async () => {
      await expect(
        controller.switchStrategy(vault.address, { from: accounts[1] })
      ).to.be.rejectedWith("!authorized");
    });

    it("should reject invalid vault address", async () => {
      await expect(controller.switchStrategy(accounts[1], { from: admin })).to
        .be.rejected;
    });
  });
});
