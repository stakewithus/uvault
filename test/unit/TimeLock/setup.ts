import "../../setup"
import { TimeLockInstance } from "../../../types/TimeLock"
import { TxReceiverInstance } from "../../../types/TxReceiver"
import { encodeCallMe } from "../../lib"

const TimeLock = artifacts.require("TimeLock")
const TxReceiver = artifacts.require("TxReceiver")

export default (accounts: Truffle.Accounts) => {
  const admin = accounts[0]

  // references to return
  interface Refs {
    admin: string
    timeLock: TimeLockInstance
    txReceiver: TxReceiverInstance
    DELAY: number
    DATA: string
  }

  // min delay
  const DELAY = 60 * 60 * 24
  const DATA = encodeCallMe(web3, "0x1212")

  const refs: Refs = {
    admin,
    // @ts-ignore
    timeLock: null,
    // @ts-ignore
    txReceiver: null,
    DELAY,
    DATA,
  }

  beforeEach(async () => {
    refs.timeLock = await TimeLock.new(DELAY)
    refs.txReceiver = await TxReceiver.new()
  })

  return refs
}
