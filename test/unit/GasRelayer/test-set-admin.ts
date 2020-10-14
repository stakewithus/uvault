import chai from "chai"
import {GasRelayerInstance} from "../../../types/GasRelayer"
import {ZERO_ADDRESS} from "../../util"
import _setup from "./setup"

contract("GasRelayer", (accounts) => {
  const refs = _setup(accounts)
  const {admin} = refs

  let gasRelayer: GasRelayerInstance
  beforeEach(() => {
    gasRelayer = refs.gasRelayer
  })

  describe("setAdmin", () => {
    it("should set admin", async () => {
      await gasRelayer.setAdmin(accounts[1], {from: admin})

      assert.equal(await gasRelayer.admin(), accounts[1])
    })

    it("should reject if caller not admin", async () => {
      await chai
        .expect(gasRelayer.setAdmin(accounts[1], {from: accounts[1]}))
        .to.be.rejectedWith("!admin")
    })

    it("should reject zero address", async () => {
      await chai
        .expect(gasRelayer.setAdmin(ZERO_ADDRESS, {from: admin}))
        .to.be.rejectedWith("admin = zero address")
    })
  })
})
