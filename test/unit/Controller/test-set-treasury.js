const { expect } = require("../../setup");
const { ZERO_ADDRESS } = require("../../util");
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

  describe("setTreasury", () => {
    it("should set treasury", async () => {
      await controller.setTreasury(accounts[2], { from: admin });

      assert.equal(await controller.treasury(), accounts[2]);
    });

    it("should reject if caller not admin", async () => {
      await expect(
        controller.setTreasury(accounts[1], { from: accounts[1] })
      ).to.be.rejectedWith("!admin");
    });

    it("should reject zero address", async () => {
      await expect(
        controller.setTreasury(ZERO_ADDRESS, { from: admin })
      ).to.be.rejectedWith("treasury = zero address");
    });
  });
});
