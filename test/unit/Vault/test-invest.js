const BN = require("bn.js");
const { expect } = require("../setup");
const { ZERO_ADDRESS, eq } = require("../../util");

const ERC20Token = artifacts.require("ERC20Token");
const MockStrategy = artifacts.require("MockStrategy");
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

  describe("invest", () => {
    const sender = accounts[1];
    const amount = new BN(10).pow(new BN(18));

    let strategy;
    beforeEach(async () => {
      await erc20.mint(sender, amount);
      await erc20.approve(vault.address, amount, { from: sender });
      await vault.deposit(amount, { from: sender });

      const controller = accounts[1];

      strategy = await MockStrategy.new(
        controller,
        vault.address,
        erc20.address,
        { from: admin }
      );

      await vault.setNextStrategy(strategy.address, { from: admin });
      await vault.switchStrategy({ from: admin });
    });

    it("should invest", async () => {
      const snapshot = async () => {
        return {
          vault: {
            availableToInvest: await vault.availableToInvest(),
          },
        };
      };

      const before = await snapshot();
      await vault.invest({ from: admin });
      const after = await snapshot();

      assert(
        eq(await strategy._getDepositAmount_(), before.vault.availableToInvest),
        "deposit"
      );
    });

    it("should not call strategy.deposit if balance = 0", async () => {
      await vault.withdraw(amount, 0, { from: sender });

      assert(eq(await vault.availableToInvest(), new BN(0)), "available");

      await vault.invest({ from: admin });

      assert(eq(await strategy._getDepositAmount_(), new BN(0)), "deposit");
    });

    it("should reject if not admin", async () => {
      await expect(vault.invest({ from: accounts[1] })).to.be.rejectedWith(
        "!admin"
      );
    });

    it("should reject if strategy not set", async () => {
      const vault = await Vault.new(
        erc20.address,
        "vault",
        "vault",
        MIN_WAIT_TIME
      );
      assert.equal(await vault.strategy(), ZERO_ADDRESS, "strategy");

      await expect(vault.invest({ from: admin })).to.be.rejectedWith(
        "strategy = zero address"
      );
    });
  });
});
