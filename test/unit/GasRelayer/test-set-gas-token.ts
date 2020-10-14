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

  describe("setGasToken", () => {
    it("should set gas token", async () => {
      await gasRelayer.setGasToken(accounts[1], {from: admin})

      assert.equal(await gasRelayer.gasToken(), accounts[1])
    })

    it("should reject if caller not admin", async () => {
      await chai
        .expect(gasRelayer.setGasToken(accounts[1], {from: accounts[1]}))
        .to.be.rejectedWith("!admin")
    })

    it("should reject zero address", async () => {
      await chai
        .expect(gasRelayer.setGasToken(ZERO_ADDRESS, {from: admin}))
        .to.be.rejectedWith("gas token = zero address")
    })
  })
})
