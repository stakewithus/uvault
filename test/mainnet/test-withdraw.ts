import {Ierc20Instance } from "../../types/Ierc20"
import {GasTokenInstance} from "../../types/GasToken"
import {GasRelayerInstance } from "../../types/GasRelayer"
import {ControllerInstance } from "../../types/Controller"
import {VaultInstance } from "../../types/Vault"
import {StrategyTestInstance } from "../../types/StrategyTest"
import {eq, add} from "../util"
import {encodeInvest, encodeWithdraw} from "./lib"
import _setup from "./setup"

contract("mainnet integration", (accounts) => {
  const refs = _setup(accounts)
  const {admin} = refs

  let gasRelayer: GasRelayerInstance
  let gasToken: GasTokenInstance
  let controller: ControllerInstance
  let vault: VaultInstance
  let strategy: StrategyTestInstance
  let underlying: Ierc20Instance
  beforeEach(async () => {
    gasRelayer = refs.gasRelayer
    gasToken = refs.gasToken
    controller = refs.controller
    vault = refs.vault
    strategy = refs.strategy
    underlying = refs.underlying

    // invest
    const txData = encodeInvest(web3, vault.address)
    await gasRelayer.relayTx(controller.address, txData, 0, {
      from: admin,
    })
  })

  it("should withdraw", async () => {
    const snapshot = async () => {
      return {
        underlying: {
          vault: await underlying.balanceOf(vault.address),
          strategy: await underlying.balanceOf(strategy.address),
        },
      }
    }

    const gasTokenBal = await gasToken.balanceOf(gasRelayer.address)
    const amount = await underlying.balanceOf(strategy.address)
    const min = amount
    const txData = encodeWithdraw(web3, strategy.address, amount, min)

    const before = await snapshot()
    await gasRelayer.relayTx(controller.address, txData, gasTokenBal)
    const after = await snapshot()

    // check strategy transferred underlying token back to vault
    assert(eq(after.underlying.vault, add(before.underlying.vault, amount)), "vault")
  })
})
