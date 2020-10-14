import "../../setup"
import {GasRelayerInstance} from "../../../types/GasRelayer"
import {MockGasTokenInstance} from "../../../types/MockGasToken"
import {TxReceiverInstance} from "../../../types/TxReceiver"

const GasRelayer = artifacts.require("GasRelayer")
const MockGasToken = artifacts.require("MockGasToken")
const TxReceiver = artifacts.require("TxReceiver")

export default (accounts: Truffle.Accounts) => {
  const admin = accounts[0]

  // references to return
  interface Refs {
    admin: string,
    gasToken: MockGasTokenInstance,
    gasRelayer: GasRelayerInstance,
    txReceiver: TxReceiverInstance,
  }
  const refs: Refs = {
    admin,
    // @ts-ignore
    gasToken: null,
    // @ts-ignore
    gasRelayer: null,
    // @ts-ignore
    txReceiver: null,
  }

  beforeEach(async () => {
    refs.gasToken = await MockGasToken.new()
    refs.gasRelayer = await GasRelayer.new(refs.gasToken.address, {
      from: admin,
    })
    refs.txReceiver = await TxReceiver.new()
  })

  return refs
}
