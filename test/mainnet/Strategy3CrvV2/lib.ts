import {
  IERC20Instance,
  StableSwap3PoolInstance,
  LiquidityGaugeInstance,
  ControllerV2Instance,
  Strategy3CrvDaiV2Contract,
  Strategy3CrvDaiV2Instance,
  Strategy3CrvUsdcV2Contract,
  Strategy3CrvUsdcV2Instance,
  Strategy3CrvUsdtV2Contract,
  Strategy3CrvUsdtV2Instance,
} from "../../../types"

export type StrategyContract =
  | Strategy3CrvDaiV2Contract
  | Strategy3CrvUsdcV2Contract
  | Strategy3CrvUsdtV2Contract

export type StrategyInstance =
  | Strategy3CrvDaiV2Instance
  | Strategy3CrvUsdcV2Instance
  | Strategy3CrvUsdtV2Instance

// references to return
export interface Refs {
  admin: string
  vault: string
  treasury: string
  underlying: IERC20Instance
  lp: IERC20Instance
  stableSwap: StableSwap3PoolInstance
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
  stableSwap: StableSwap3PoolInstance
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
