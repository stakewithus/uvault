const BN = require("bn.js");
const {expect} = require("../../setup");
const {eq, add, sub, frac} = require("../../util");
const setup = require("./setup");

const MockStrategy = artifacts.require("MockStrategy");

contract("Vault", (accounts) => {
  const MIN_WAIT_TIME = 0;

  const refs = setup(accounts, MIN_WAIT_TIME);
  const {admin} = refs;

  let vault;
  let erc20;
  beforeEach(() => {
    vault = refs.vault;
    erc20 = refs.erc20;
  });

  describe("withdraw", () => {
    const sender = accounts[1];
    const amount = new BN(10).pow(new BN(18));
    const min = frac(amount, new BN(99), new BN(100));

    beforeEach(async () => {
      await erc20.mint(sender, amount);
      await erc20.approve(vault.address, amount, {from: sender});
      await vault.deposit(amount, {from: sender});
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
      await vault.withdraw(amount, min, {from: sender});
      const after = await snapshot();

      // check erc20 balance
      assert(sub(after.erc20.sender, before.erc20.sender).gte(min), "erc20 sender");
      assert(sub(before.erc20.vault, after.erc20.vault).gte(min), "erc20 vault");

      // check vault balance
      assert(
        eq(after.vault.balanceOf.sender, sub(before.vault.balanceOf.sender, amount)),
        "vault sender"
      );
      assert(
        eq(after.vault.totalSupply, sub(before.vault.totalSupply, amount)),
        "total supply"
      );
    });

    it("should reject if returned amount < min", async () => {
      const min = add(amount, new BN(1));

      await expect(vault.withdraw(amount, min, {from: sender})).to.be.rejectedWith(
        "withdraw amount < min"
      );
    });

    it("should withdraw from strategy", async () => {
      const snapshot = async () => {
        return {
          vault: {
            balanceInVault: await vault.balanceInVault(),
          },
        };
      };

      const controller = accounts[1];

      const strategy = await MockStrategy.new(
        controller,
        vault.address,
        erc20.address,
        {from: admin}
      );

      // set balance in strategy, this would increate vault.totalValueLocked()
      const balInStrategy = new BN(10).pow(new BN(18));
      await strategy._setBalance_(balInStrategy);

      const amountToWithdraw = await vault.calcWithdraw(amount);

      const before = await snapshot();
      await vault.withdraw(amount, 0, {from: sender});
      const after = await snapshot();

      assert(
        eq(
          await strategy._withdrawAmount_(),
          sub(amountToWithdraw, before.vault.balanceInVault)
        ),
        "strategy withdraw"
      );
    });

    it("should reject if balance = 0", async () => {
      const bal = await vault.balanceOf(sender);
      await vault.withdraw(bal, 0, {from: sender});

      await expect(vault.withdraw(bal, 0, {from: sender})).to.be.rejected;
    });

    it("should reject if amount = 0", async () => {
      await expect(vault.withdraw(0, 0, {from: sender})).to.be.rejectedWith(
        "shares = 0"
      );
    });
  });
});
