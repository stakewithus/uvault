import { IERC20Instance, GasRelayerInstance, TxReceiverInstance } from "../../../types"

export interface Refs {
  admin: string
  gasRelayer: GasRelayerInstance
  gasToken: IERC20Instance
  txReceiver: TxReceiverInstance
}

export function getSnapshot(params: {
  gasRelayer: GasRelayerInstance
  gasToken: IERC20Instance
}) {
  const { gasRelayer, gasToken } = params

  return async () => {
    const snapshot = {
      gasToken: {
        gasRelayer: await gasToken.balanceOf(gasRelayer.address),
      },
    }

    return snapshot
  }
}
