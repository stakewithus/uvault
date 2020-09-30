const {expect} = require("../../setup")
const setup = require("./setup")

contract("Controller", (accounts) => {
  const refs = setup(accounts)
  const {admin, gasRelayer} = refs
  const min = 123

  let controller
  let vault
  let strategy
  beforeEach(() => {
    controller = refs.controller
    vault = refs.vault
    strategy = refs.strategy
  })

  describe("setStrategy", () => {
    it("should set strategy admin", async () => {
      await controller.setStrategy(vault.address, strategy.address, min, {from: admin})

      assert.equal(await vault.strategy(), strategy.address, "strategy")
      assert.equal(await vault._strategyMin_(), min, "min")
    })

    it("should set strategy gas relayer", async () => {
      await controller.setStrategy(vault.address, strategy.address, min, {
        from: gasRelayer,
      })

      assert.equal(await vault.strategy(), strategy.address, "strategy")
      assert.equal(await vault._strategyMin_(), min, "min")
    })

    it("should reject if caller not authorized", async () => {
      await expect(
        controller.setStrategy(vault.address, strategy.address, min, {
          from: accounts[1],
        })
      ).to.be.rejectedWith("!authorized")
    })

    it("should reject if vault does not exist", async () => {
      await expect(
        controller.setStrategy(accounts[1], strategy.address, min, {from: admin})
      ).to.be.rejected
    })
  })
})
