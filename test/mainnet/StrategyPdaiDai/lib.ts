import { IERC20Instance } from "../../../types/IERC20"
import { MasterChefInstance } from "../../../types/MasterChef"
import { ControllerInstance } from "../../../types/Controller"
import { StrategyPdaiDaiInstance } from "../../../types/StrategyPdaiDai"

// references to return
export interface Refs {
  admin: string
  vault: string
  treasury: string
  underlying: IERC20Instance
  jar: IERC20Instance
  chef: MasterChefInstance
  pickle: IERC20Instance
  controller: ControllerInstance
  strategy: StrategyPdaiDaiInstance
  whale: string
}

export function getSnapshot(params: {
  strategy: StrategyPdaiDaiInstance
  underlying: IERC20Instance
  jar: IERC20Instance
  chef: MasterChefInstance
  pickle: IERC20Instance
  vault: string
  treasury: string
}) {
  const { strategy, underlying, jar, chef, pickle, vault, treasury } = params

  return async () => {
    const snapshot = {
      strategy: {
        totalAssets: await strategy.totalAssets(),
        totalDebt: await strategy.totalDebt(),
      },
      underlying: {
        vault: await underlying.balanceOf(vault),
        strategy: await underlying.balanceOf(strategy.address),
        treasury: await underlying.balanceOf(treasury),
      },
      jar: {
        chef: await jar.balanceOf(chef.address),
        strategy: await jar.balanceOf(strategy.address),
      },
      pickle: {
        strategy: await pickle.balanceOf(strategy.address),
      },
      chef: {
        staked: (await chef.userInfo(16, strategy.address))[0],
      },
    }

    return snapshot
  }
}
