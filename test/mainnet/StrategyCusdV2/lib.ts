import {
  IERC20Instance,
  StableSwapCompoundInstance,
  LiquidityGaugeInstance,
  ControllerV2Instance,
  StrategyCusdDaiV2Contract,
  StrategyCusdDaiV2Instance,
  StrategyCusdUsdcV2Contract,
  StrategyCusdUsdcV2Instance,
} from "../../../types"

export type StrategyContract = StrategyCusdDaiV2Contract | StrategyCusdUsdcV2Contract

export type StrategyInstance = StrategyCusdDaiV2Instance | StrategyCusdUsdcV2Instance

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
