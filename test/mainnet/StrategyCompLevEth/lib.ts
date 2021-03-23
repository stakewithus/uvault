import BN from "bn.js"
import {
  IERC20Instance,
  ControllerInstance,
  StrategyCompLevEthInstance,
} from "../../../types"

// references to return
export interface Refs {
  web3: Web3
  admin: string
  vault: string
  treasury: string
  keeper: string
  cToken: IERC20Instance
  controller: ControllerInstance
  strategy: StrategyCompLevEthInstance
}

export type Setup = (accounts: Truffle.Accounts) => Refs

export function getSnapshot(params: {
  web3: Web3
  strategy: StrategyCompLevEthInstance
  cToken: IERC20Instance
  vault: string
  treasury: string
}) {
  const { web3, strategy, cToken, vault, treasury } = params

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
      eth: {
        vault: new BN(await web3.eth.getBalance(vault)),
        strategy: new BN(await web3.eth.getBalance(strategy.address)),
        treasury: new BN(await web3.eth.getBalance(treasury)),
      },
      cToken: {
        strategy: await cToken.balanceOf(strategy.address),
      },
    }

    return snapshot
  }
}
