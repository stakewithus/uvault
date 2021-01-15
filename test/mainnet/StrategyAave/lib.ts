import {
  IERC20Instance,
  LiquidityGaugeV2Instance,
  ControllerV2Instance,
  StrategyAaveDaiContract,
  StrategyAaveDaiInstance,
  StrategyAaveUsdcContract,
  StrategyAaveUsdcInstance,
  StrategyAaveUsdtContract,
  StrategyAaveUsdtInstance,
} from "../../../types"

export type StrategyContract =
  | StrategyAaveDaiContract
  | StrategyAaveUsdcContract
  | StrategyAaveUsdtContract

export type StrategyInstance =
  | StrategyAaveDaiInstance
  | StrategyAaveUsdcInstance
  | StrategyAaveUsdtInstance

// references to return
export interface Refs {
  admin: string
  vault: string
  treasury: string
  underlying: IERC20Instance
  lp: IERC20Instance
  gauge: LiquidityGaugeV2Instance
  crv: IERC20Instance
  controller: ControllerV2Instance
  strategy: StrategyInstance
  whale: string
}

export type Setup = (accounts: Truffle.Accounts) => Refs

export function getSnapshot(params: {
  strategy: StrategyInstance
  underlying: IERC20Instance
  lp: IERC20Instance
  gauge: LiquidityGaugeV2Instance
  crv: IERC20Instance
  vault: string
  treasury: string
}) {
  const { strategy, underlying, lp, gauge, crv, vault, treasury } = params

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
      lp: {
        strategy: await lp.balanceOf(strategy.address),
      },
      gauge: {
        strategy: await gauge.balanceOf(strategy.address),
      },
      crv: {
        strategy: await crv.balanceOf(strategy.address),
      },
    }

    return snapshot
  }
}
