import hre from "hardhat"
import config from "./config"
import {getAddress} from "./lib"

/*
env $(cat .env) HARDHAT_NETWORK=mainnet npx ts-node scripts/print-vault-events.ts daiSafeVault
*/
async function main() {
  const network = hre.network.name
  const vaultName = process.argv[2]
  const vaultAddr = getAddress(config, network, vaultName)

  console.log(`Network: ${network}`)
  console.log(`${vaultName}: ${vaultAddr}`)

  try {
    // @ts-ignore
    const vault = await hre.ethers.getContractAt("Vault", vaultAddr)

    console.log("===== Events =====")

    // SetStrategy
    let filter = vault.filters.SetStrategy()
    let logs = await vault.queryFilter(filter)

    const events = []
    for (const log of logs) {
      events.push({
        block: log.blockNumber,
        //@ts-ignore
        strategy: log.args.strategy,
      })
    }
    // newest first
    events.reverse()

    console.log(`SetStrategy`)
    console.log(`block | strategy`)
    for (const event of events) {
      console.log(`${event.block} | ${event.strategy}`)
    }

    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

main()
