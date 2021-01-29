import {
  IERC20Instance,
  StableSwapYInstance,
  LiquidityGaugeInstance,
  ControllerInstance,
  StrategyYDaiV2Contract,
  StrategyYDaiV2Instance,
  StrategyYUsdcV2Contract,
  StrategyYUsdcV2Instance,
  StrategyYUsdtV2Contract,
  StrategyYUsdtV2Instance,
} from "../../../types"

export type StrategyContract =
  | StrategyYDaiV2Contract
  | StrategyYUsdcV2Contract
  | StrategyYUsdtV2Contract

export type StrategyInstance =
  | StrategyYDaiV2Instance
  | StrategyYUsdcV2Instance
  | StrategyYUsdtV2Instance

// references to return
export interface Refs {
  admin: string
  vault: string
  treasury: string
  underlying: IERC20Instance
  lp: IERC20Instance
  stableSwap: StableSwapYInstance
  gauge: LiquidityGaugeInstance
  crv: IERC20Instance
  controller: ControllerInstance
  strategy: StrategyInstance
  whale: string
}

export type Setup = (accounts: Truffle.Accounts) => Refs

export function getSnapshot(params: {
  strategy: StrategyInstance
  underlying: IERC20Instance
  lp: IERC20Instance
  stableSwap: StableSwapYInstance
  gauge: LiquidityGaugeInstance
  crv: IERC20Instance
  vault: string
  treasury: string
}) {
  const { strategy, underlying, lp, stableSwap, gauge, crv, vault, treasury } = params

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
      stableSwap: {
        virtualPrice: await stableSwap.get_virtual_price(),
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
