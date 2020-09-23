const BN = require("bn.js");
const { expect } = require("./setup");
const { ZERO_ADDRESS, eq, add, sub, frac, MAX_UINT } = require("../util");
const { assert } = require("chai");

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

  describe("setNextStrategy", () => {
    let strategy;
    beforeEach(async () => {
      const controller = accounts[1];

      strategy = await MockStrategy.new(
        controller,
        vault.address,
        erc20.address,
        { from: admin }
      );
    });

    it("should set next strategy when current strategy is not set", async () => {
      const tx = await vault.setNextStrategy(strategy.address, { from: admin });

      assert.equal(tx.logs[0].event, "SetNextStrategy", "event");
      assert.equal(
        tx.logs[0].args.nextStrategy,
        strategy.address,
        "event arg next strategy"
      );
      assert.equal(await vault.nextStrategy(), strategy.address);
      assert(eq(await vault.timeLock(), new BN(0)), "time lock");
    });

    it.skip("should set next strategy when current strategy is set", async () => {
      // Cannot test without having a strategy set first.
      // test for integration
    });

    it("should reject if not admin", async () => {
      await expect(
        vault.setNextStrategy(strategy.address, { from: accounts[1] })
      ).to.be.rejectedWith("!admin");
    });

    it("should reject zero address", async () => {
      await expect(
        vault.setNextStrategy(ZERO_ADDRESS, { from: accounts[1] })
      ).to.be.rejectedWith("!admin");
    });

    it("should reject strategy.token != vault.token", async () => {
      // use non zero address to mock underlying token address
      await strategy._setUnderlyingToken_(accounts[0]);

      await expect(
        vault.setNextStrategy(strategy.address, { from: admin })
      ).to.be.rejectedWith("strategy.token != vault.token");
    });

    it("should reject strategy.vault != vault", async () => {
      // use non zero address to mock vault address
      await strategy._setVault_(accounts[0]);

      await expect(
        vault.setNextStrategy(strategy.address, { from: admin })
      ).to.be.rejectedWith("strategy.vault != vault");
    });

    it("should reject same strategy", async () => {
      await vault.setNextStrategy(strategy.address, { from: admin });

      await expect(
        vault.setNextStrategy(strategy.address, { from: admin })
      ).to.be.rejectedWith("same next strategy");
    });
  });

  describe("deposit", () => {
    const sender = accounts[1];
    const amount = new BN(10).pow(new BN(18));

    beforeEach(async () => {
      await erc20.mint(sender, amount);
      await erc20.approve(vault.address, amount, { from: sender });
    });

    it("should deposit", async () => {
      const snapshot = async () => {
        return {
          erc20: {
            sender: await erc20.balanceOf(sender),
            vault: await erc20.balanceOf(vault.address),
          },
          vault: {
            balanceOf: {
              sender: await vault.balanceOf(sender),
            },
            totalSupply: await vault.totalSupply(),
          },
        };
      };

      const before = await snapshot();
      await vault.deposit(amount, { from: sender });
      const after = await snapshot();

      // check erc20 balance
      assert(
        eq(after.erc20.sender, sub(before.erc20.sender, amount)),
        "erc20 sender"
      );
      assert(
        eq(after.erc20.vault, add(before.erc20.vault, amount)),
        "erc20 vault"
      );

      // check vault balance
      assert(
        eq(
          after.vault.balanceOf.sender,
          add(before.vault.balanceOf.sender, amount)
        ),
        "vault sender"
      );
      assert(
        eq(after.vault.totalSupply, add(before.vault.totalSupply, amount)),
        "total supply"
      );
    });

    it("should reject if amount = 0", async () => {
      await expect(vault.deposit(0, { from: sender })).to.be.rejectedWith(
        "amount = 0"
      );
    });
  });

  describe("withdraw", () => {
    const sender = accounts[1];
    const amount = new BN(10).pow(new BN(18));
    const min = frac(amount, new BN(99), new BN(100));

    beforeEach(async () => {
      await erc20.mint(sender, amount);
      await erc20.approve(vault.address, amount, { from: sender });
      await vault.deposit(amount, { from: sender });
    });

    it("should withdraw from vault", async () => {
      const snapshot = async () => {
        return {
          erc20: {
            sender: await erc20.balanceOf(sender),
            vault: await erc20.balanceOf(vault.address),
          },
          vault: {
            balanceOf: {
              sender: await vault.balanceOf(sender),
            },
            totalSupply: await vault.totalSupply(),
          },
        };
      };

      const before = await snapshot();
      await vault.withdraw(amount, min, { from: sender });
      const after = await snapshot();

      // check erc20 balance
      assert(
        sub(after.erc20.sender, before.erc20.sender).gte(min),
        "erc20 sender"
      );
      assert(
        sub(before.erc20.vault, after.erc20.vault).gte(min),
        "erc20 vault"
      );

      // check vault balance
      assert(
        eq(
          after.vault.balanceOf.sender,
          sub(before.vault.balanceOf.sender, amount)
        ),
        "vault sender"
      );
      assert(
        eq(after.vault.totalSupply, sub(before.vault.totalSupply, amount)),
        "total supply"
      );
    });

    it("should reject if returned amount < min", async () => {
      const min = add(amount, new BN(1));

      await expect(
        vault.withdraw(amount, min, { from: sender })
      ).to.be.rejectedWith("withdraw amount < min");
    });

    it.skip("should withdraw from strategy", async () => {
      // integration test
      // cannot test without calling invest() and transferring tokens to strategy
    });

    it("should reject if balance = 0", async () => {
      const bal = await vault.balanceOf(sender);
      await vault.withdraw(bal, 0, { from: sender });

      await expect(vault.withdraw(bal, 0, { from: sender })).to.be.rejected;
    });

    it("should reject if amount = 0", async () => {
      await expect(vault.withdraw(0, 0, { from: sender })).to.be.rejectedWith(
        "shares = 0"
      );
    });
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
