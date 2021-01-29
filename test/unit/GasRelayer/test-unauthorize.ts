import chai from "chai"
import { GasRelayerInstance } from "../../../types/GasRelayer"
import _setup from "./setup"

contract("GasRelayer", (accounts) => {
  const refs = _setup(accounts)
  const { admin } = refs

  let gasRelayer: GasRelayerInstance
  beforeEach(() => {
    gasRelayer = refs.gasRelayer
  })

  describe("unauthorize", () => {
    const addr = accounts[1]

    beforeEach(async () => {
      await gasRelayer.authorize(addr, { from: admin })
    })

    it("should unauthorize", async () => {
      await gasRelayer.unauthorize(addr, { from: admin })

      assert.equal(await gasRelayer.authorized(addr), false, "authorized")
    })

    it("should reject if caller not admin", async () => {
      await chai
        .expect(gasRelayer.unauthorize(addr, { from: accounts[1] }))
        .to.be.rejectedWith("!admin")
    })
  })
})
