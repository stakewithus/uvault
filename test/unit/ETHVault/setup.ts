import "../../setup"
import {
  ETHVaultInstance,
  MockControllerInstance,
  StrategyETHTestInstance,
} from "../../../types"

const ETHVault = artifacts.require("ETHVault")
const MockController = artifacts.require("MockController")
const StrategyETHTest = artifacts.require("StrategyETHTest")

export default (accounts: Truffle.Accounts) => {
  const admin = accounts[0]
  const treasury = accounts[1]
  const timeLock = accounts[2]

  // references to return
  interface Refs {
    admin: string
    treasury: string
    vault: ETHVaultInstance
    controller: MockControllerInstance
    timeLock: string
    strategy: StrategyETHTestInstance
  }

  const refs: Refs = {
    admin,
    treasury,
    // @ts-ignore
    vault: null,
    // @ts-ignore
    controller: null,
    timeLock,
    // @ts-ignore
    strategy: null,
  }

  beforeEach(async () => {
    refs.controller = await MockController.new(treasury)
    refs.vault = await ETHVault.new(refs.controller.address, timeLock)

    refs.strategy = await StrategyETHTest.new(
      refs.controller.address,
      refs.vault.address,
      { from: admin }
    )
  })

  return refs
}
