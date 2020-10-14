const {chai.expect} = require("../../setup")
const {ZERO_ADDRESS} = require("../../util")
const setup = require("./setup")

contract("GasRelayer", (accounts) => {
  const refs = setup(accounts)
  const {admin} = refs

  let gasRelayer
  beforeEach(() => {
    gasRelayer = refs.gasRelayer
  })

  describe("setAdmin", () => {
    it("should set admin", async () => {
      await gasRelayer.setAdmin(accounts[1], {from: admin})

      assert.equal(await gasRelayer.admin(), accounts[1])
    })

    it("should reject if caller not admin", async () => {
      await chai.expect(
        gasRelayer.setAdmin(accounts[1], {from: accounts[1]})
      ).to.be.rejectedWith("!admin")
    })

    it("should reject zero address", async () => {
      await chai.expect(gasRelayer.setAdmin(ZERO_ADDRESS, {from: admin})).to.be.rejectedWith(
        "admin = zero address"
      )
    })
  })
})
