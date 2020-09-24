const { expect } = require("../setup");
const { ZERO_ADDRESS } = require("../../util");

const ERC20Token = artifacts.require("ERC20Token");
const Vault = artifacts.require("Vault");

contract("Vault", (accounts) => {
  const admin = accounts[0];
  // mock controller address
  const controller = accounts[1];

  let erc20;
  before(async () => {
    erc20 = await ERC20Token.new();
  });

  // set to 0 so we can immediately set strategy for other tests
  const MIN_WAIT_TIME = 0;

  let vault;
  beforeEach(async () => {
    vault = await Vault.new(
      controller,
      erc20.address,
      "vault",
      "vault",
      MIN_WAIT_TIME
    );
  });

  describe("setAdmin", () => {
    it("should set admin", async () => {
      await vault.setAdmin(accounts[1], { from: admin });

      assert.equal(await vault.admin(), accounts[1]);
    });

    it("should reject if caller not admin", async () => {
      await expect(
        vault.setAdmin(accounts[1], { from: accounts[1] })
      ).to.be.rejectedWith("!admin");
    });

    it("should reject zero address", async () => {
      await expect(
        vault.setAdmin(ZERO_ADDRESS, { from: admin })
      ).to.be.rejectedWith("admin = zero address");
    });
  });
});
