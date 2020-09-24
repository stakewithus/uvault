const BN = require("bn.js");
const { expect } = require("../setup");
const { ZERO_ADDRESS, eq, add, MAX_UINT } = require("../../util");
const setup = require("./setup");

const MockStrategy = artifacts.require("MockStrategy");
const Vault = artifacts.require("Vault");

contract("Vault", (accounts) => {
  const MIN_WAIT_TIME = 0;

  const refs = setup(accounts, MIN_WAIT_TIME);
  const { admin, controller } = refs;

  let vault;
  let erc20;
  beforeEach(() => {
    vault = refs.vault;
    erc20 = refs.erc20;
  });

  describe("rebalance", () => {
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

    it("should rebalance", async () => {
      const snapshot = async () => {
        return {
          vault: {
            availableToInvest: await vault.availableToInvest(),
          },
          strategy: {
            underlyingBalance: await strategy.underlyingBalance(),
          },
        };
      };

      const before = await snapshot();
      await vault.rebalance({ from: admin });
      const after = await snapshot();

      assert(eq(await strategy._getWithdrawAmount_(), MAX_UINT), "withdraw");

      assert(
        eq(
          await strategy._getDepositAmount_(),
          add(before.vault.availableToInvest, before.strategy.underlyingBalance)
        ),
        "deposit"
      );
    });

    it("should reject if not admin", async () => {
      await expect(vault.rebalance({ from: accounts[1] })).to.be.rejectedWith(
        "!admin"
      );
    });

    it("should reject if strategy not set", async () => {
      const vault = await Vault.new(
        controller,
        erc20.address,
        "vault",
        "vault",
        MIN_WAIT_TIME
      );
      assert.equal(await vault.strategy(), ZERO_ADDRESS, "strategy");

      await expect(vault.rebalance({ from: admin })).to.be.rejectedWith(
        "strategy = zero address"
      );
    });
  });
});
