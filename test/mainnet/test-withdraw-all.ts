import BN from "bn.js"
import {Ierc20Instance } from "../../types/Ierc20"
import {GasTokenInstance} from "../../types/GasToken"
import {GasRelayerInstance } from "../../types/GasRelayer"
import {ControllerInstance } from "../../types/Controller"
import {VaultInstance } from "../../types/Vault"
import {StrategyTestInstance } from "../../types/StrategyTest"
import {eq, add} from "../util"
import {encodeInvest, encodeWithdrawAll} from "./lib"
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
  let newStrategy: StrategyTestInstance
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

  it("should withdraw all", async () => {
    const snapshot = async () => {
      return {
        underlying: {
          vault: await underlying.balanceOf(vault.address),
          strategy: await underlying.balanceOf(strategy.address),
        },
      }
    }

    const gasTokenBal = await gasToken.balanceOf(gasRelayer.address)
    const min = await underlying.balanceOf(strategy.address)
    const txData = encodeWithdrawAll(web3, strategy.address, min)

    const before = await snapshot()
    await gasRelayer.relayTx(controller.address, txData, gasTokenBal)
    const after = await snapshot()

    // check strategy transferred all underlying token back to vault
    assert(
      eq(
        after.underlying.vault,
        add(before.underlying.vault, before.underlying.strategy)
      ),
      "vault"
    )
    // check strategy balance is zero
    assert(eq(after.underlying.strategy, new BN(0)), "strategy")
  })
})
