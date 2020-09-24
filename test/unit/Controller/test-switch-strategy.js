const { expect } = require("../setup");
const setup = require("./setup");

contract("Controller", (accounts) => {
  const refs = setup(accounts);
  const { admin } = refs;

  let controller;
  let vault;
  beforeEach(() => {
    controller = refs.controller;
    vault = refs.vault;
  });

  describe("switchStrategy", () => {
    it("should switch strategy", async () => {
      await controller.switchStrategy(vault.address, { from: admin });

      assert(await vault._switchStrategyWasCalled_(), "switch strategy");
    });

    it("should reject if caller not admin", async () => {
      await expect(
        controller.switchStrategy(vault.address, { from: accounts[1] })
      ).to.be.rejectedWith("!admin");
    });

    it("should reject invalid vault address", async () => {
      await expect(controller.switchStrategy(accounts[1], { from: admin })).to
        .be.rejected;
    });
  });
});
