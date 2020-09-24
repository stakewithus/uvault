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

  describe("rebalance", () => {
    it("should rebalance", async () => {
      await controller.rebalance(vault.address, { from: admin });

      assert(await vault._rebalanceWasCalled_(), "rebalance");
    });

    it("should reject if caller not admin", async () => {
      await expect(
        controller.rebalance(vault.address, { from: accounts[1] })
      ).to.be.rejectedWith("!admin");
    });

    it("should reject invalid vault address", async () => {
      await expect(controller.rebalance(accounts[1], { from: admin })).to.be
        .rejected;
    });
  });
});
