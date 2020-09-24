const BN = require("bn.js");
const { expect } = require("../setup");
const { eq, add, sub } = require("../../util");

const ERC20Token = artifacts.require("ERC20Token");
const Vault = artifacts.require("Vault");

contract("Vault", (accounts) => {
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
