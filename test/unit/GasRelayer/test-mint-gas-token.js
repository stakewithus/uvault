const setup = require("./setup");
const BN = require("bn.js");
const { eq } = require("../../util");

contract("GasRelayer", (accounts) => {
  const refs = setup(accounts);

  let gasRelayer;
  let gasToken;
  beforeEach(() => {
    gasRelayer = refs.gasRelayer;
    gasToken = refs.gasToken;
  });

  describe("mintGasToken", () => {
    it("should mint gas token", async () => {
      const amount = new BN(123);
      await gasRelayer.mintGasToken(123);

      assert(eq(await gasToken._mintAmount_(), amount), "mint amount");
    });
  });
});
