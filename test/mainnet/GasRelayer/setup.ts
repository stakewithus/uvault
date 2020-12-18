import BN from "bn.js"
import { sendEther } from "../../util"
import { CHI } from "../config"
import { Refs } from "./lib"

const IERC20 = artifacts.require("IERC20")
const GasRelayer = artifacts.require("GasRelayer")
const TxReceiver = artifacts.require("TxReceiver")

export default (accounts: Truffle.Accounts) => {
  const admin = accounts[0]

  const refs: Refs = {
    admin,
    // @ts-ignore
    gasRelayer: null,
    // @ts-ignore
    gasToken: null,
    // @ts-ignore
    txReceiver: null,
  }

  beforeEach(async () => {
    refs.gasRelayer = await GasRelayer.new(CHI)
    refs.gasToken = await IERC20.at(CHI)
    refs.txReceiver = await TxReceiver.new()

    // max CHI token that can be minted in one block
    await refs.gasRelayer.mintGasToken(140)
  })

  return refs
}
