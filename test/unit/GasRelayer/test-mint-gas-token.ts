import BN from "bn.js"
import {GasRelayerInstance} from "../../../types/GasRelayer"
import {MockGasTokenInstance} from "../../../types/MockGasToken"
import {eq} from "../../util"
import _setup from "./setup"

contract("GasRelayer", (accounts) => {
  const refs = _setup(accounts)

  let gasRelayer: GasRelayerInstance
  let gasToken: MockGasTokenInstance
  beforeEach(() => {
    gasRelayer = refs.gasRelayer
    gasToken = refs.gasToken
  })

  describe("mintGasToken", () => {
    it("should mint gas token", async () => {
      const amount = new BN(123)
      await gasRelayer.mintGasToken(amount)

      assert(eq(await gasToken._mintAmount_(), amount), "mint amount")
    })
  })
})
