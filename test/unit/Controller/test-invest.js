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

  describe("invest", () => {
    it("should invest", async () => {
      await controller.invest(vault.address, { from: admin });

      assert(await vault._investWasCalled_(), "invest");
    });

    it("should reject if caller not admin", async () => {
      await expect(
        controller.invest(vault.address, { from: accounts[1] })
      ).to.be.rejectedWith("!admin");
    });

    it("should reject invalid vault address", async () => {
      await expect(controller.invest(accounts[1], { from: admin })).to.be
        .rejected;
    });
  });
});
