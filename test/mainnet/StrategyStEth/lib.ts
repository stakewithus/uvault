import BN from "bn.js"
import {
  IERC20Instance,
  StableSwapSTETHInstance,
  LiquidityGaugeV2Instance,
  ControllerInstance,
  StrategyStEthInstance,
} from "../../../types"

// references to return
export interface Refs {
  web3: Web3
  admin: string
  vault: string
  treasury: string
  lp: IERC20Instance
  stableSwap: StableSwapSTETHInstance
  gauge: LiquidityGaugeV2Instance
  crv: IERC20Instance
  controller: ControllerInstance
  strategy: StrategyStEthInstance
}

export function getSnapshot(params: {
  web3: Web3
  strategy: StrategyStEthInstance
  lp: IERC20Instance
  stableSwap: StableSwapSTETHInstance
  gauge: LiquidityGaugeV2Instance
  crv: IERC20Instance
  vault: string
  treasury: string
}) {
  const { web3, strategy, lp, stableSwap, gauge, crv, vault, treasury } = params

  return async () => {
    const snapshot = {
      strategy: {
        totalAssets: await strategy.totalAssets(),
        totalDebt: await strategy.totalDebt(),
      },
      eth: {
        vault: new BN(await web3.eth.getBalance(vault)),
        strategy: new BN(await web3.eth.getBalance(strategy.address)),
        treasury: new BN(await web3.eth.getBalance(treasury)),
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
