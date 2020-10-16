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
    strategy: string
    nextStrategy: string
    timeLock: BN
    minWaitTime: BN
    reserveMin: BN
    withdrawFee: BN
    paused: boolean
    minReserve: BN
    balanceInVault: BN
    balanceInStrategy: BN
    totalAssets: BN
  }
}

async function snapshot(vaultAddr: string): Promise<Snapshot> {
  const vault = await ethers.getContractAt("Vault", vaultAddr)

  // TS bug? cannot return correct values when using await inside hash map
  const admin = await vault.admin()
  const controller = await vault.controller()
  const strategy = await vault.strategy()
  const nextStrategy = await vault.nextStrategy()
  const timeLock = await vault.timeLock()
  const minWaitTime = await vault.minWaitTime()
  const reserveMin = await vault.reserveMin()
  const withdrawFee = await vault.withdrawFee()
  const paused = await vault.paused()
  const minReserve = await vault.minReserve()
  const balanceInVault = await vault.balanceInVault()
  const balanceInStrategy = await vault.balanceInStrategy()
  const totalAssets = await vault.totalAssets()

  return {
    vault: {
      address: vaultAddr,
      admin,
      controller,
      strategy,
      nextStrategy,
      timeLock,
      minWaitTime,
      reserveMin,
      withdrawFee,
      paused,
      minReserve,
      balanceInVault,
      balanceInStrategy,
      totalAssets,
    },
  }
}

function formatBN(x: BN, decimals: number): string {
  return ethers.utils.formatUnits(x.toString(), decimals)
}

function formatDate(d: BN): string {
  const t = d.toNumber() * 1000

  if (t == 0) {
    return "0"
  }

  return new Date(t).toISOString()
}

function formatPercent(x: BN, max: number): string {
  const _x = x.toNumber()
  return `${((_x / max) * 100).toFixed(2)} %`
}

function printSnapshot(snap: Snapshot, decimals: number, addrToStrat: any) {
  const currentStratName = addrToStrat[snap.vault.strategy]
  const nextStratName = addrToStrat[snap.vault.nextStrategy]

  console.log(`Vault ${snap.vault.address}`)
  console.log(`admin: ${snap.vault.admin}`)
  console.log(`controller: ${snap.vault.controller}`)
  console.log(`strategy: ${currentStratName} ${snap.vault.strategy}`)
  console.log(`next strategy: ${nextStratName} ${snap.vault.nextStrategy}`)
  console.log(`time lock: ${formatDate(snap.vault.timeLock)}`)
  console.log(`min wait time: ${snap.vault.minWaitTime.toLocaleString()}`)
  console.log(`withdraw fee: ${formatPercent(snap.vault.withdrawFee, FEE_MAX)}`)
  console.log(`reserve min: ${formatPercent(snap.vault.reserveMin, RESERVE_MAX)}`)
  console.log(`paused: ${snap.vault.paused}`)
  console.log(`balance in vault: ${formatBN(snap.vault.balanceInVault, decimals)}`)
  console.log(
    `balance in strategy: ${formatBN(snap.vault.balanceInStrategy, decimals)}`
  )
  console.log(`total assets: ${formatBN(snap.vault.totalAssets, decimals)}`)
  console.log(`min reserve: ${formatBN(snap.vault.minReserve, decimals)}`)
}

interface Vault {
  name: string
  address: string
  decimals: number
}

async function main() {
  try {
    const {
      daiVault,
      usdcVault,
      usdtVault,
      strategyDaiTo3Crv,
      strategyDaiToCusd,
      strategyUsdcTo3Crv,
      strategyUsdcToCusd,
      strategyUsdtTo3Crv,
    } = config.mainnet

    const addrToStrat = {
      [strategyDaiTo3Crv]: "DAI -> 3CRV",
      [strategyDaiToCusd]: "DAI -> CUSD",
      [strategyUsdcTo3Crv]: "USDC -> 3CRV",
      [strategyUsdcToCusd]: "USDC -> CUSD",
      [strategyUsdtTo3Crv]: "USDT -> 3Crv",
    }

    const vaults: Vault[] = [
      {
        name: "DAI Vault",
        address: daiVault,
        decimals: 18,
      },
      {
        name: "USDC Vault",
        address: usdcVault,
        decimals: 6,
      },
      {
        name: "USDT Vault",
        address: usdtVault,
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
