import {
  IERC20Instance,
  MasterChefInstance,
  PickleStakingInstance,
  ControllerInstance,
  StrategyPdaiDaiInstance,
} from "../../../types"

// references to return
export interface Refs {
  admin: string
  vault: string
  treasury: string
  underlying: IERC20Instance
  jar: IERC20Instance
  chef: MasterChefInstance
  pickle: IERC20Instance
  staking: PickleStakingInstance
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
  staking: PickleStakingInstance
  vault: string
  treasury: string
}) {
  const { strategy, underlying, jar, chef, pickle, staking, vault, treasury } = params

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
      staking: {
        strategy: await staking.balanceOf(strategy.address),
        earned: await staking.earned(strategy.address),
      },
    }

    return snapshot
  }
}
