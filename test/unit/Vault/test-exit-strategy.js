const { expect } = require("../setup");
const setup = require("./setup");

contract("Vault", (accounts) => {
  const MIN_WAIT_TIME = 0;

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

  describe("exitStrategy", () => {
    describe("strategy is set", () => {
      beforeEach(async () => {
        await vault.setNextStrategy(strategy.address, { from: admin });
        await vault.switchStrategy({ from: admin });
      });

      it("should exit", async () => {
        await vault.exitStrategy({ from: controller });

        assert(await strategy._wasExitCalled_(), "exit");
      });

      it("should reject if caller not controller", async () => {
        await expect(
          vault.exitStrategy({ from: accounts[3] })
        ).to.be.rejectedWith("!controller");
      });
    });

    it("should reject if strategy not defined", async () => {
      await expect(vault.exitStrategy({ from: controller })).to.be.rejectedWith(
        "strategy = zero address"
      );
    });
  });
});
