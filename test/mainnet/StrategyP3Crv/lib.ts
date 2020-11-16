import {
  IERC20Instance,
  MasterChefInstance,
  ControllerInstance,
  StrategyP3CrvDaiContract,
  StrategyP3CrvDaiInstance,
  StrategyP3CrvUsdcContract,
  StrategyP3CrvUsdcInstance,
  StrategyP3CrvUsdtContract,
  StrategyP3CrvUsdtInstance,
} from "../../../types"

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
  underlying: IERC20Instance
  jar: IERC20Instance
  chef: MasterChefInstance
  pickle: IERC20Instance
  threeCrv: IERC20Instance
  controller: ControllerInstance
  strategy: StrategyInstance
  whale: string
}

export type Setup = (accounts: Truffle.Accounts) => Refs

export function getSnapshot(params: {
  strategy: StrategyInstance
  underlying: IERC20Instance
  jar: IERC20Instance
  chef: MasterChefInstance
  pickle: IERC20Instance
  threeCrv: IERC20Instance
  vault: string
  treasury: string
}) {
  const { strategy, underlying, jar, chef, pickle, threeCrv, vault, treasury } = params

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
      chef: {
        staked: (await chef.userInfo(14, strategy.address))[0],
      },
    }

    return snapshot
  }
}
