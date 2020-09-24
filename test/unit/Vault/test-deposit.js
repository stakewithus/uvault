const BN = require("bn.js");
const { expect } = require("../../setup");
const { eq, add, sub } = require("../../util");
const setup = require("./setup");

contract("Vault", (accounts) => {
  const MIN_WAIT_TIME = 0;

  const refs = setup(accounts, MIN_WAIT_TIME);

  let vault;
  let erc20;
  beforeEach(() => {
    vault = refs.vault;
    erc20 = refs.erc20;
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
});
