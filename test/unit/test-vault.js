const BN = require("bn.js");
const { expect } = require("./setup");
const { ZERO_ADDRESS, eq } = require("../util");

const ERC20Token = artifacts.require("ERC20Token");
const Vault = artifacts.require("Vault");

contract("Vault", (accounts) => {
  const admin = accounts[0];

  let erc20;
  before(async () => {
    erc20 = await ERC20Token.new();
  });

  const MIN_WAIT_TIME = 0;

  let vault;
  beforeEach(async () => {
    vault = await Vault.new(erc20.address, "vault", "vault", MIN_WAIT_TIME);
  });

  describe("constructor", () => {
    it("should deploy", async () => {
      const vault = await Vault.new(
        erc20.address,
        "vault",
        "vault",
        MIN_WAIT_TIME
      );

      assert.equal(await vault.admin(), admin, "admin");
      assert.equal(await vault.token(), erc20.address, "token");
      assert(
        eq(await vault.minWaitTime(), new BN(MIN_WAIT_TIME)),
        "min wait time"
      );
      assert(eq(await vault.decimals(), await erc20.decimals(), "decimals"));
    });

    it("should reject if token is zero address", async () => {
      await expect(Vault.new(ZERO_ADDRESS, "vault", "vault", MIN_WAIT_TIME)).to
        .be.rejected;
    });
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
