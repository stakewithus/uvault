const BN = require("bn.js");
const { expect } = require("../setup");
const {
  ZERO_ADDRESS,
  eq,
  getBlockTimestamp,
  timeout,
  MAX_UINT,
} = require("../../util");
const setup = require("./setup");

const MockStrategy = artifacts.require("MockStrategy");
const Vault = artifacts.require("Vault");

contract("Vault", (accounts) => {
  const MIN_WAIT_TIME = 2;

  const refs = setup(accounts, MIN_WAIT_TIME);
  const { admin, controller } = refs;

  let vault;
  let erc20;
  let strategy;
  beforeEach(() => {
    vault = refs.vault;
    erc20 = refs.erc20;
    strategy = refs.strategy;
  });

  describe("switchStrategy", () => {
    beforeEach(async () => {
      await vault.setNextStrategy(strategy.address, { from: admin });
    });

    it("should set new strategy", async () => {
      const tx = await vault.switchStrategy({ from: controller });

      assert.equal(tx.logs[1].event, "SwitchStrategy", "event");
      assert.equal(
        tx.logs[1].args.strategy,
        strategy.address,
        "event arg switch strategy"
      );
      assert.equal(await vault.strategy(), strategy.address);
      assert(
        eq(await erc20.allowance(vault.address, strategy.address), MAX_UINT)
      );
      assert.isFalse(await strategy._wasExitCalled_(), "exit");
    });

    it("should switch strategy", async () => {
      const oldStrategy = strategy;
      const newStrategy = await MockStrategy.new(
        controller,
        vault.address,
        erc20.address,
        { from: admin }
      );

      const snapshot = async () => {
        return {
          erc20: {
            allowance: {
              oldStrategy: await erc20.allowance(
                vault.address,
                oldStrategy.address
              ),
              newStrategy: await erc20.allowance(
                vault.address,
                newStrategy.address
              ),
            },
          },
          vault: {
            strategy: await vault.strategy(),
          },
        };
      };

      await vault.switchStrategy({ from: controller });
      await vault.setNextStrategy(newStrategy.address, { from: admin });
      await timeout(MIN_WAIT_TIME);

      const before = await snapshot();
      await vault.switchStrategy({ from: controller });
      const after = await snapshot();

      assert.equal(before.vault.strategy, oldStrategy.address, "old strategy");
      assert.equal(after.vault.strategy, newStrategy.address, "new strategy");
      assert(
        eq(after.erc20.allowance.newStrategy, MAX_UINT),
        "allowance new strategy"
      );
      assert(
        eq(after.erc20.allowance.oldStrategy, new BN(0)),
        "allowance old strategy"
      );
    });

    it("should reject if not controller", async () => {
      await expect(
        vault.switchStrategy({ from: accounts[0] })
      ).to.be.rejectedWith("!controller");
    });

    it("should reject if strategy is zero address", async () => {
      const vault = await Vault.new(
        controller,
        erc20.address,
        "vault",
        "vault",
        MIN_WAIT_TIME
      );

      await expect(
        vault.switchStrategy({ from: controller })
      ).to.be.rejectedWith("next strategy = zero address");
    });

    it("should reject if same strategy", async () => {
      vault.switchStrategy({ from: controller });

      await expect(
        vault.switchStrategy({ from: controller })
      ).to.be.rejectedWith("next strategy = current strategy");
    });

    it("should reject timestamp < time lock", async () => {
      await vault.switchStrategy({ from: controller });

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

      assert(
        (await vault.timeLock()).gte(timestamp + MIN_WAIT_TIME),
        "time lock"
      );

      await expect(
        vault.switchStrategy({ from: controller })
      ).to.be.rejectedWith("timestamp < time lock");
    });
  });
});
