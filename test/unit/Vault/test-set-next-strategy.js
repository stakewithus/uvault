const BN = require("bn.js");
const { expect } = require("../setup");
const { ZERO_ADDRESS, eq, getBlockTimestamp } = require("../../util");

const ERC20Token = artifacts.require("ERC20Token");
const MockStrategy = artifacts.require("MockStrategy");
const Vault = artifacts.require("Vault");

contract("Vault", (accounts) => {
  const admin = accounts[0];
  // mock controller address
  const controller = accounts[1];

  let erc20;
  before(async () => {
    erc20 = await ERC20Token.new();
  });

  const MIN_WAIT_TIME = 100;

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

  describe("setNextStrategy", () => {
    const controller = accounts[1];

    let strategy;
    beforeEach(async () => {
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
        tx.logs[0].args.strategy,
        strategy.address,
        "event arg next strategy"
      );
      assert.equal(await vault.nextStrategy(), strategy.address);
      assert(eq(await vault.timeLock(), new BN(0)), "time lock");
    });

    it("should set next strategy when current strategy is set", async () => {
      await vault.setNextStrategy(strategy.address, { from: admin });
      await vault.switchStrategy({ from: admin });

      assert.equal(await vault.strategy(), strategy.address, "strategy");

      const newStrategy = await MockStrategy.new(
        controller,
        vault.address,
        erc20.address,
        { from: admin }
      );
      const tx = await vault.setNextStrategy(newStrategy.address, {
        from: admin,
      });

      const timestamp = await getBlockTimestamp(web3, tx);

      assert.equal(
        await vault.nextStrategy(),
        newStrategy.address,
        "next strategy"
      );
      assert(
        eq(await vault.timeLock(), new BN(timestamp + MIN_WAIT_TIME)),
        "time lock"
      );
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
});
