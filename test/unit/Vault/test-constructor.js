const BN = require("bn.js");
const { expect } = require("../setup");
const { ZERO_ADDRESS, eq } = require("../../util");

const ERC20Token = artifacts.require("ERC20Token");
const Vault = artifacts.require("Vault");

contract("Vault", (accounts) => {
  const admin = accounts[0];

  let erc20;
  before(async () => {
    erc20 = await ERC20Token.new();
  });

  // set to 0 so we can immediately set strategy for other tests
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

      assert.equal(await vault.strategy(), ZERO_ADDRESS, "strategy");
      assert(eq(await vault.timeLock(), new BN(0)), "time lock");
    });

    it("should reject if token is zero address", async () => {
      await expect(Vault.new(ZERO_ADDRESS, "vault", "vault", MIN_WAIT_TIME)).to
        .be.rejected;
    });
  });
});
