import {
  IERC20Instance,
  StableSwapCompoundInstance,
  LiquidityGaugeInstance,
  ControllerV2Instance,
  StrategyGusdDaiV2Contract,
  StrategyGusdDaiV2Instance,
  StrategyGusdUsdcV2Contract,
  StrategyGusdUsdcV2Instance,
  StrategyGusdUsdtV2Contract,
  StrategyGusdUsdtV2Instance,
} from "../../../types"

export type StrategyContract =
  | StrategyGusdDaiV2Contract
  | StrategyGusdUsdcV2Contract
  | StrategyGusdUsdtV2Contract

export type StrategyInstance =
  | StrategyGusdDaiV2Instance
  | StrategyGusdUsdcV2Instance
  | StrategyGusdUsdtV2Instance

// references to return
export interface Refs {
  admin: string
  vault: string
  treasury: string
  underlying: IERC20Instance
  lp: IERC20Instance
  stableSwap: StableSwapCompoundInstance
  gauge: LiquidityGaugeInstance
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
  stableSwap: StableSwapCompoundInstance
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
