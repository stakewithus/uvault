import BN from "bn.js"
import bre, {ethers} from "@nomiclabs/buidler"
import config from "../config"
import {getAccount, getAddress} from "../lib"

async function main() {
  const network = bre.network.name
  console.log(`USDC vault on ${network}`)

  try {
    const USDC_VAULT_ADDRESS = getAddress(config, network, "usdcVault")

    const vault = await ethers.getContractAt("Vault", USDC_VAULT_ADDRESS)

    // @ts-ignore
    async function snapshot() {
      return {
        vault: {
          admin: await vault.admin(),
          controller: await vault.controller(),
          strategy: await vault.strategy(),
          nextStrategy: await vault.nextStrategy(),
          timeLock: await vault.timeLock(),
          minWaitTime: await vault.minWaitTime(),
          reserveMin: await vault.reserveMin(),
          withdrawMin: await vault.withdrawMin(),
          withdrawFee: await vault.withdrawFee(),
          paused: await vault.paused(),
          balanceInVault: await vault.balanceInVault(),
          balanceInStrategy: await vault.balanceInStrategy(),
          totalAssets: await vault.totalAssets(),
          minReserve: await vault.minReserve(),
        },
      }
    }

    const snap = await snapshot()

    console.log(`USDC Vault ${USDC_VAULT_ADDRESS}`)
    console.log(`admin: ${snap.vault.admin}`)
    console.log(`controller: ${snap.vault.controller}`)
    console.log(`paused: ${snap.vault.paused}`)
    console.log(`strategy: ${snap.vault.strategy}`)
    console.log(`next strategy: ${snap.vault.nextStrategy}`)
    console.log(`time lock: ${snap.vault.timeLock.toLocaleString()}`)
    console.log(`min wait time: ${snap.vault.minWaitTime.toLocaleString()}`)
    console.log(`reserve min: ${snap.vault.reserveMin.toLocaleString()}`)
    console.log(`withdraw min: ${snap.vault.withdrawMin.toLocaleString()}`)
    console.log(`withdraw fee: ${snap.vault.withdrawFee.toLocaleString()}`)
    console.log(`balance in vault: ${snap.vault.balanceInVault.toLocaleString()}`)
    console.log(`balance in strategy: ${snap.vault.balanceInStrategy.toLocaleString()}`)
    console.log(`total assets: ${snap.vault.totalAssets.toLocaleString()}`)
    console.log(`min reserve: ${snap.vault.minReserve.toLocaleString()}`)

    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

main()
