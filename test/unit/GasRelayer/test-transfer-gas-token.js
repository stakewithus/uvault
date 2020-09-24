const setup = require("./setup");
const BN = require("bn.js");
const { expect } = require("../../setup");
const { eq } = require("../../util");

contract("GasRelayer", (accounts) => {
  const refs = setup(accounts);

  let gasRelayer;
  let gasToken;
  beforeEach(() => {
    gasRelayer = refs.gasRelayer;
    gasToken = refs.gasToken;
  });

  describe("transferGasToken", () => {
    it("should transfer gas token", async () => {
      const to = accounts[0];
      const amount = new BN(123);

      await gasRelayer.transferGasToken(to, amount);

      assert.equal(await gasToken._transferTo_(), to, "transfer to");
      assert(eq(await gasToken._transferAmount_(), amount), "transfer amount");
    });

    it("should reject if caller not admin", async () => {
      await expect(
        gasRelayer.transferGasToken(accounts[0], 123, { from: accounts[1] })
      ).to.be.rejectedWith("!admin");
    });
  });
});
