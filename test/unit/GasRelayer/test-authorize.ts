import chai from "chai"
import {GasRelayerInstance} from "../../../types/GasRelayer"
import _setup from "./setup"

contract("GasRelayer", (accounts) => {
  const refs = _setup(accounts)
  const {admin} = refs

  let gasRelayer: GasRelayerInstance
  beforeEach(() => {
    gasRelayer = refs.gasRelayer
  })

  describe("authorize", () => {
    it("should authorize", async () => {
      await gasRelayer.authorize(accounts[1], {from: admin})

      assert.equal(await gasRelayer.authorized(accounts[1]), true, "authorized")
    })

    it("should reject if caller not admin", async () => {
      await chai
        .expect(gasRelayer.authorize(accounts[1], {from: accounts[1]}))
        .to.be.rejectedWith("!admin")
    })
  })
})
