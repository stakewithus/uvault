import {Ierc20Instance} from "../../../types/Ierc20"
import {MasterChefInstance} from "../../../types/MasterChef"
import {ControllerInstance} from "../../../types/Controller"
import {
  StrategyP3CrvDaiContract,
  StrategyP3CrvDaiInstance,
} from "../../../types/StrategyP3CrvDai"
import {
  StrategyP3CrvUsdcContract,
  StrategyP3CrvUsdcInstance,
} from "../../../types/StrategyP3CrvUsdc"
import {
  StrategyP3CrvUsdtContract,
  StrategyP3CrvUsdtInstance,
} from "../../../types/StrategyP3CrvUsdt"

export type StrategyContract =
  | StrategyP3CrvDaiContract
  | StrategyP3CrvUsdcContract
  | StrategyP3CrvUsdtContract

export type StrategyInstance =
  | StrategyP3CrvDaiInstance
  | StrategyP3CrvUsdcInstance
  | StrategyP3CrvUsdtInstance

// references to return
export interface Refs {
  admin: string
  vault: string
  treasury: string
  underlying: Ierc20Instance
  jar: Ierc20Instance
  chef: MasterChefInstance
  pickle: Ierc20Instance
  threeCrv: Ierc20Instance
  controller: ControllerInstance
  strategy: StrategyInstance
  whale: string
}

export type Setup = (accounts: Truffle.Accounts) => Refs

export function getSnapshot(params: {
  strategy: StrategyInstance
  underlying: Ierc20Instance
  jar: Ierc20Instance
  chef: MasterChefInstance
  pickle: Ierc20Instance
  threeCrv: Ierc20Instance
  vault: string
  treasury: string
}) {
  const {strategy, underlying, jar, chef, pickle, threeCrv, vault, treasury} = params

  return async () => {
    const snapshot = {
      strategy: {
        totalAssets: await strategy.totalAssets(),
      },
      underlying: {
        vault: await underlying.balanceOf(vault),
        strategy: await underlying.balanceOf(strategy.address),
        treasury: await underlying.balanceOf(treasury),
      },
      threeCrv: {
        jar: await threeCrv.balanceOf(jar.address),
        strategy: await threeCrv.balanceOf(strategy.address),
      },
      jar: {
        chef: await jar.balanceOf(chef.address),
        strategy: await jar.balanceOf(strategy.address),
      },
      pickle: {
        strategy: await pickle.balanceOf(strategy.address),
      },
    }

    return snapshot
  }
}
