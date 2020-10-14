import {Ierc20Instance} from "../../../types/Ierc20"
import {GaugeInstance} from "../../../types/Gauge"
import {ControllerInstance} from "../../../types/Controller"
import {
  StrategyDaiToCusdContract,
  StrategyDaiToCusdInstance,
} from "../../../types/StrategyDaiToCusd"
import {
  StrategyUsdcToCusdContract,
  StrategyUsdcToCusdInstance,
} from "../../../types/StrategyUsdcToCusd"
import {
  StrategyDaiTo3CrvContract,
  StrategyDaiTo3CrvInstance,
} from "../../../types/StrategyDaiTo3Crv"
import {
  StrategyUsdcTo3CrvContract,
  StrategyUsdcTo3CrvInstance,
} from "../../../types/StrategyUsdcTo3Crv"
import {
  StrategyUsdtTo3CrvContract,
  StrategyUsdtTo3CrvInstance,
} from "../../../types/StrategyUsdtTo3Crv"

export type StrategyContract =
  | StrategyDaiToCusdContract
  | StrategyUsdcToCusdContract
  | StrategyDaiTo3CrvContract
  | StrategyUsdcTo3CrvContract
  | StrategyUsdtTo3CrvContract

export type StrategyInstance =
  | StrategyUsdcToCusdInstance
  | StrategyUsdcToCusdInstance
  | StrategyDaiTo3CrvInstance
  | StrategyUsdcTo3CrvInstance
  | StrategyUsdtTo3CrvInstance

// references to return
export interface Refs {
  admin: string
  vault: string
  treasury: string
  underlying: Ierc20Instance
  cUnderlying: Ierc20Instance
  gauge: GaugeInstance
  crv: Ierc20Instance
  controller: ControllerInstance
  strategy: StrategyInstance
  whale: string
}

export type Setup = (accounts: Truffle.Accounts) => Refs

export function getSnapshot(params: {
  strategy: StrategyInstance
  underlying: Ierc20Instance
  cUnderlying: Ierc20Instance
  gauge: GaugeInstance
  crv: Ierc20Instance
  vault: string
  treasury: string
}) {
  const {strategy, underlying, cUnderlying, gauge, crv, vault, treasury} = params

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
      cUnderlying: {
        strategy: await cUnderlying.balanceOf(strategy.address),
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
