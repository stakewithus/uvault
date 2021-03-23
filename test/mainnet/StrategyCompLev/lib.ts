import {
  IERC20Instance,
  ControllerInstance,
  StrategyCompLevDaiContract,
  StrategyCompLevDaiInstance,
  StrategyCompLevUsdcContract,
  StrategyCompLevUsdcInstance,
  StrategyCompLevWbtcContract,
  StrategyCompLevWbtcInstance,
} from "../../../types"

export type StrategyContract =
  | StrategyCompLevDaiContract
  | StrategyCompLevUsdcContract
  | StrategyCompLevWbtcContract

export type StrategyInstance =
  | StrategyCompLevDaiInstance
  | StrategyCompLevUsdcInstance
  | StrategyCompLevWbtcInstance

// references to return
export interface Refs {
  admin: string
  vault: string
  treasury: string
  keeper: string
  underlying: IERC20Instance
  cToken: IERC20Instance
  controller: ControllerInstance
  strategy: StrategyInstance
  whale: string
}

export type Setup = (accounts: Truffle.Accounts) => Refs

export function getSnapshot(params: {
  strategy: StrategyInstance
  underlying: IERC20Instance
  cToken: IERC20Instance
  vault: string
  treasury: string
}) {
  const { strategy, underlying, cToken, vault, treasury } = params

  return async () => {
    const {
      0: supplied,
      1: borrowed,
      2: marketCol,
      3: safeCol,
    } = await strategy.getLivePosition.call() // use static call

    const snapshot = {
      strategy: {
        totalAssets: await strategy.totalAssets(),
        totalDebt: await strategy.totalDebt(),
        supplied,
        borrowed,
        marketCol,
        safeCol,
        unleveraged: supplied.sub(borrowed),
      },
      underlying: {
        vault: await underlying.balanceOf(vault),
        strategy: await underlying.balanceOf(strategy.address),
        treasury: await underlying.balanceOf(treasury),
      },
      cToken: {
        strategy: await cToken.balanceOf(strategy.address),
      },
    }

    return snapshot
  }
}
