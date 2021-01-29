import chai from "chai"
import BN from "bn.js"
import { GasRelayerInstance } from "../../../types/GasRelayer"
import { MockGasTokenInstance } from "../../../types/MockGasToken"
import { eq } from "../../util"
import _setup from "./setup"

contract("GasRelayer", (accounts) => {
  const refs = _setup(accounts)

  let gasRelayer: GasRelayerInstance
  let gasToken: MockGasTokenInstance
  beforeEach(() => {
    gasRelayer = refs.gasRelayer
    gasToken = refs.gasToken
  })

  describe("transferGasToken", () => {
    it("should transfer gas token", async () => {
      const to = accounts[0]
      const amount = new BN(123)

      await gasRelayer.transferGasToken(to, amount)

      assert.equal(await gasToken._transferTo_(), to, "transfer to")
      assert(eq(await gasToken._transferAmount_(), amount), "transfer amount")
    })

    it("should reject if caller not admin", async () => {
      await chai
        .expect(gasRelayer.transferGasToken(accounts[0], 123, { from: accounts[1] }))
        .to.be.rejectedWith("!admin")
    })
  })
})
