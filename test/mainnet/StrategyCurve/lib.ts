import {IERC20Instance} from "../../../types/IERC20"
import {GaugeInstance} from "../../../types/Gauge"
import {ControllerInstance} from "../../../types/Controller"
import {
  StrategyCusdDaiContract,
  StrategyCusdDaiInstance,
} from "../../../types/StrategyCusdDai"
import {
  StrategyCusdUsdcContract,
  StrategyCusdUsdcInstance,
} from "../../../types/StrategyCusdUsdc"
import {
  Strategy3CrvDaiContract,
  Strategy3CrvDaiInstance,
} from "../../../types/Strategy3CrvDai"
import {
  Strategy3CrvUsdcContract,
  Strategy3CrvUsdcInstance,
} from "../../../types/Strategy3CrvUsdc"
import {
  Strategy3CrvUsdtContract,
  Strategy3CrvUsdtInstance,
} from "../../../types/Strategy3CrvUsdt"

export type StrategyContract =
  | StrategyCusdDaiContract
  | StrategyCusdUsdcContract
  | Strategy3CrvDaiContract
  | Strategy3CrvUsdcContract
  | Strategy3CrvUsdtContract

export type StrategyInstance =
  | StrategyCusdUsdcInstance
  | StrategyCusdDaiInstance
  | Strategy3CrvDaiInstance
  | Strategy3CrvUsdcInstance
  | Strategy3CrvUsdtInstance

// references to return
export interface Refs {
  admin: string
  vault: string
  treasury: string
  underlying: IERC20Instance
  lp: IERC20Instance
  gauge: GaugeInstance
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
  gauge: GaugeInstance
  crv: IERC20Instance
  vault: string
  treasury: string
}) {
  const {strategy, underlying, lp, gauge, crv, vault, treasury} = params

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
