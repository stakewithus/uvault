import BN from "bn.js"
import {ethers} from "@nomiclabs/buidler"
import config from "../config"

const FEE_MAX = 10000
const RESERVE_MAX = 10000

interface Snapshot {
  vault: {
    address: string
    admin: string
    controller: string
    timeLock: string
    strategy: string
    paused: boolean
    withdrawFee: BN
    reserveMin: BN
    minReserve: BN
    availableToInvest: BN
    balanceInVault: BN
    balanceInStrategy: BN
    totalDebtInStrategy: BN
    totalAssets: BN
  }
}

async function snapshot(vaultAddr: string): Promise<Snapshot> {
  const vault = await ethers.getContractAt("Vault", vaultAddr)

  // TS bug? cannot return correct values when using await inside hash map
  const admin = await vault.admin()
  const controller = await vault.controller()
  const timeLock = await vault.timeLock()
  const strategy = await vault.strategy()
  const paused = await vault.paused()
  const withdrawFee = await vault.withdrawFee()
  const reserveMin = await vault.reserveMin()
  const minReserve = await vault.minReserve()
  const availableToInvest = await vault.availableToInvest()
  const balanceInVault = await vault.balanceInVault()
  const balanceInStrategy = await vault.balanceInStrategy()
  const totalDebtInStrategy = await vault.totalDebtInStrategy()
  const totalAssets = await vault.totalAssets()

  return {
    vault: {
      address: vaultAddr,
      admin,
      controller,
      timeLock,
      strategy,
      paused,
      withdrawFee,
      reserveMin,
      minReserve,
      availableToInvest,
      balanceInVault,
      balanceInStrategy,
      totalDebtInStrategy,
      totalAssets,
    },
  }
}

function formatBN(x: BN, decimals: number): string {
  return ethers.utils.formatUnits(x.toString(), decimals)
}

function formatPercent(x: BN, max: number): string {
  const _x = x.toNumber()
  return `${((_x / max) * 100).toFixed(2)} %`
}

function printSnapshot(snap: Snapshot, decimals: number, addrToStrat: any) {
  const currentStratName = addrToStrat[snap.vault.strategy]

  console.log(`Vault ${snap.vault.address}`)
  console.log(`admin: ${snap.vault.admin}`)
  console.log(`controller: ${snap.vault.controller}`)
  console.log(`time lock: ${snap.vault.timeLock}`)
  console.log(`strategy: ${currentStratName} ${snap.vault.strategy}`)
  console.log(`paused: ${snap.vault.paused}`)
  console.log(`withdraw fee: ${formatPercent(snap.vault.withdrawFee, FEE_MAX)}`)
  console.log(`reserve min: ${formatPercent(snap.vault.reserveMin, RESERVE_MAX)}`)
  console.log(`min reserve: ${formatBN(snap.vault.minReserve, decimals)}`)
  console.log(
    `available to invest: ${formatBN(snap.vault.availableToInvest, decimals)}`
  )
  console.log(`balance in vault: ${formatBN(snap.vault.balanceInVault, decimals)}`)
  console.log(
    `balance in strategy: ${formatBN(snap.vault.balanceInStrategy, decimals)}`
  )
  console.log(
    `total debt in strategy: ${formatBN(snap.vault.totalDebtInStrategy, decimals)}`
  )
  console.log(`total assets: ${formatBN(snap.vault.totalAssets, decimals)}`)
}

interface Vault {
  name: string
  address: string
  decimals: number
}

async function main() {
  try {
    const {
      daiSafeVault,
      usdcSafeVault,
      usdtSafeVault,
      strategyCusdDai,
      strategyCusdUsdc,
      strategy3CrvDai,
      strategy3CrvUsdc,
      strategy3CrvUsdt,
      strategyP3CrvDai,
      strategyP3CrvUsdc,
      strategyP3CrvUsdt,
    } = config.mainnet

    const addrToStrat = {
      [strategyCusdDai]: "DAI -> CUSD",
      [strategyCusdUsdc]: "USDC -> CUSD",
      [strategy3CrvDai]: "DAI -> 3CRV",
      [strategy3CrvUsdc]: "USDC -> 3CRV",
      [strategy3CrvUsdt]: "USDT -> 3CRV",
      [strategyP3CrvDai]: "DAI -> P3CRV",
      [strategyP3CrvUsdc]: "USDC -> P3CRV",
      [strategyP3CrvUsdt]: "USDT -> P3CRV",
    }

    const vaults: Vault[] = [
      {
        name: "DAI Safe Vault",
        address: daiSafeVault,
        decimals: 18,
      },
      {
        name: "USDC Safe Vault",
        address: usdcSafeVault,
        decimals: 6,
      },
      {
        name: "USDT Safe Vault",
        address: usdtSafeVault,
        decimals: 6,
      },
    ]

    for (const vault of vaults) {
      console.log("===", vault.name, "===")
      const snap = await snapshot(vault.address)
      printSnapshot(snap, vault.decimals, addrToStrat)
      console.log()
    }

    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

main()
