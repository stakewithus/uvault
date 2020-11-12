import hre from "hardhat"
import config from "./config"
import {getAddress} from "./lib"

interface Log {
  blockNumber: number
  event: string | undefined
  args: any
}

/*
env $(cat .env) HARDHAT_NETWORK=ropsten npx ts-node scripts/print-time-lock-events.ts
*/
async function main() {
  const network = hre.network.name
  const timeLockAddr = getAddress(config, network, "timeLock")

  console.log(`Network: ${network}`)
  console.log(`timeLock: ${timeLockAddr}`)

  try {
    // @ts-ignore
    const timeLock = await hre.ethers.getContractAt("TimeLock", timeLockAddr)

    console.log("===== Events =====")

    const filters = [
      timeLock.filters.Queue(),
      timeLock.filters.Execute(),
      timeLock.filters.Cancel(),
    ]
    const logs: Log[] = []
    for (const filter of filters) {
      const _logs = await timeLock.queryFilter(filter)
      for (const log of _logs) {
        const {blockNumber, event, args} = log

        logs.push({
          blockNumber,
          event,
          args,
        })
      }
    }

    // sort by block number (asc)
    logs.sort((a, b) => a.blockNumber - b.blockNumber)

    for (const log of logs) {
      console.log({
        blockNumber: log.blockNumber,
        event: log.event,
        txHash: log.args.txHash,
        target: log.args.target,
        value: log.args.value.toString(),
        eta: log.args.eta.toString(),
        data: log.args.data,
      })
    }

    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

main()
