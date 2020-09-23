const { expect } = require("../setup");
const { ZERO_ADDRESS } = require("../../util");

const Controller = artifacts.require("Controller");

contract("Controller", (accounts) => {
  const admin = accounts[0];
  const treasury = accounts[1];

  let controller;
  beforeEach(async () => {
    controller = await Controller.new(treasury, { from: admin });
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
