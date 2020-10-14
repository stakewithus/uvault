import BN from "bn.js"
import {Ierc20Instance} from "../../types/Ierc20"
import {GasTokenInstance} from "../../types/GasToken"
import {GasRelayerInstance} from "../../types/GasRelayer"
import {ControllerInstance} from "../../types/Controller"
import {VaultInstance} from "../../types/Vault"
import {StrategyTestInstance} from "../../types/StrategyTest"
import {eq, sub} from "../util"
import {encodeInvest} from "./lib"
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
  beforeEach(() => {
    gasRelayer = refs.gasRelayer
    gasToken = refs.gasToken
    controller = refs.controller
    vault = refs.vault
    strategy = refs.strategy
    underlying = refs.underlying
  })

  it("should invest", async () => {
    const snapshot = async () => {
      return {
        gasToken: {
          gasRelayer: await gasToken.balanceOf(gasRelayer.address),
        },
        underlying: {
          vault: await underlying.balanceOf(vault.address),
          strategy: await underlying.balanceOf(strategy.address),
        },
        vault: {
          availableToInvest: await vault.availableToInvest(),
        },
      }
    }

    const gasTokenBal = await gasToken.balanceOf(gasRelayer.address)
    const txData = encodeInvest(web3, vault.address)

    const before = await snapshot()
    await gasRelayer.relayTx(controller.address, txData, gasTokenBal, {
      from: admin,
    })
    const after = await snapshot()

    // check gas token was used
    assert(after.gasToken.gasRelayer.lte(before.gasToken.gasRelayer), "gas token")
    // check underlying was transferred from vault to strategy
    assert(before.underlying.vault.gt(new BN(0)), "vault before")
    assert(
      eq(
        after.underlying.vault,
        sub(before.underlying.vault, before.vault.availableToInvest)
      ),
      "vault after"
    )
    assert(eq(after.underlying.strategy, before.vault.availableToInvest), "strategy")
  })
})
