const {chai.expect} = require("../../setup")
const setup = require("./setup")
const {assert} = require("chai")

contract("Vault", (accounts) => {
  const MIN_WAIT_TIME = 0

  const refs = setup(accounts, MIN_WAIT_TIME)
  const {admin} = refs

  let vault
  let erc20
  let strategy
  beforeEach(() => {
    vault = refs.vault
    erc20 = refs.erc20
    strategy = refs.strategy
  })

  describe("revokeStrategy", () => {
    beforeEach(async () => {
      await vault.setNextStrategy(strategy.address, {from: admin})
      await vault.setStrategy(strategy.address, {from: admin})
    })

    it("should revoke", async () => {
      await vault.revokeStrategy(strategy.address, {from: admin})

      assert.isFalse(await vault.strategies(strategy.address), "strategy")
    })

    it("should reject if not admin", async () => {
      await chai.expect(
        vault.revokeStrategy(strategy.address, {from: accounts[1]})
      ).to.be.rejectedWith("!admin")
    })
  })
})
