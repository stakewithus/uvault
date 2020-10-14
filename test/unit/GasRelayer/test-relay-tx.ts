import chai from "chai"
import BN from "bn.js"
import {TxReceiverInstance} from "../../../types"
import {GasRelayerInstance} from "../../../types/GasRelayer"
import {MockGasTokenInstance} from "../../../types/MockGasToken"
import {eq} from "../../util"
import _setup from "./setup"

function encode(web3: Web3, data: string) {
  return web3.eth.abi.encodeFunctionCall(
    {
      name: "callMe",
      type: "function",
      inputs: [
        {
          type: "bytes",
          name: "data",
        },
      ],
    },
    [data]
  )
}

contract("GasRelayer", (accounts) => {
  const refs = _setup(accounts)
  const {admin} = refs

  let gasRelayer: GasRelayerInstance
  let gasToken: MockGasTokenInstance
  let txReceiver: TxReceiverInstance
  beforeEach(async () => {
    gasRelayer = refs.gasRelayer
    gasToken = refs.gasToken
    txReceiver = refs.txReceiver
  })

  describe("relayTx", () => {
    const maxGasToken = new BN(1000)
    const data = encode(web3, "0x1212")

    it("should relay tx use gas token = max", async () => {
      const maxGasToken = new BN(1)
      gasRelayer.relayTx(txReceiver.address, data, maxGasToken, {from: admin})

      assert(eq(await gasToken._freeUpToAmount_(), maxGasToken), "free up to amount")
      assert.equal(await txReceiver._data_(), "0x1212", "tx data")
    })

    it("should relay tx use gas token <= max", async () => {
      gasRelayer.relayTx(txReceiver.address, data, maxGasToken, {from: admin})

      assert((await gasToken._freeUpToAmount_()).lte(maxGasToken), "free up to amount")
      assert.equal(await txReceiver._data_(), "0x1212", "tx data")
    })

    it("should reject if caller not admin", async () => {
      await chai
        .expect(
          gasRelayer.relayTx(txReceiver.address, data, maxGasToken, {
            from: accounts[1],
          })
        )
        .to.be.rejectedWith("!admin")
    })

    it("should reject if tx failed", async () => {
      await txReceiver._setFail_(true)

      await chai
        .expect(
          gasRelayer.relayTx(txReceiver.address, data, maxGasToken, {from: admin})
        )
        .to.be.rejectedWith("failed")
    })
  })
})
