const { expect } = require("../setup");

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

  describe("setMin", () => {
    it("should set min", async () => {
      await vault.setMin(123, { from: admin });

      assert.equal(await vault.min(), 123);
    });

    it("should reject if caller not admin", async () => {
      await expect(vault.setMin(123, { from: accounts[1] })).to.be.rejectedWith(
        "!admin"
      );
    });

    it("should reject min > max", async () => {
      await expect(vault.setMin(10001, { from: admin })).to.be.rejectedWith(
        "min > max"
      );
    });
  });
});
