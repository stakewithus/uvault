import BN from "bn.js"
import setup from "./setup"
import { IERC20Instance, GasRelayerInstance, TxReceiverInstance } from "../../../types"
import { encodeCallMe } from "../../lib"
import { getSnapshot } from "./lib"

const MAX_GAS_TOKEN = 140
const DATA = encodeCallMe(web3, "0x1212")

contract("GasRelayer", (accounts) => {
  const refs = setup(accounts)

  let gasToken: IERC20Instance
  let gasRelayer: GasRelayerInstance
  let txReceiver: TxReceiverInstance
  beforeEach(() => {
    gasToken = refs.gasToken
    gasRelayer = refs.gasRelayer
    txReceiver = refs.txReceiver
  })

  it("should relay tx", async () => {
    const snapshot = getSnapshot({
      gasToken,
      gasRelayer,
    })

    const before = await snapshot()
    await gasRelayer.relayTx(txReceiver.address, DATA, MAX_GAS_TOKEN)
    const after = await snapshot()

    const diff = before.gasToken.gasRelayer.sub(after.gasToken.gasRelayer)

    assert(diff.gt(new BN(0)), "gas token diff")
    assert.equal(await txReceiver._data_(), "0x1212", "tx data")
  })
})
