import {Ierc20Instance} from "../../../types/Ierc20"
import {GasTokenInstance} from "../../../types/GasToken"
import {GasRelayerInstance} from "../../../types/GasRelayer"
import {ControllerInstance} from "../../../types/Controller"
import {VaultInstance} from "../../../types/Vault"
import {StrategyTestInstance} from "../../../types/StrategyTest"
import {encodeHarvest} from "./lib"
import _setup from "./setup"

contract("mainnet integration", (accounts) => {
  const refs = _setup(accounts)

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
  })

  it("should harvest", async () => {
    const gasTokenBal = await gasToken.balanceOf(gasRelayer.address)
    const txData = encodeHarvest(web3, strategy.address)

    await gasRelayer.relayTx(controller.address, txData, gasTokenBal)

    assert(await strategy._harvestWasCalled_(), "harvest")
  })
})
