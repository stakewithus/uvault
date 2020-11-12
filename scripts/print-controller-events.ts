import hre from "hardhat"
import config from "./config"
import {getAddress} from "./lib"

/*
env $(cat .env) HARDHAT_NETWORK=mainnet npx ts-node scripts/print-controller-events.ts
*/
async function main() {
  const network = hre.network.name
  const controllerAddr = getAddress(config, network, "controller")

  console.log(`Network: ${network}`)
  console.log(`controller: ${controllerAddr}`)

  try {
    // @ts-ignore
    const controller = await hre.ethers.getContractAt("Controller", controllerAddr)

    const adminRole = await controller.ADMIN_ROLE()
    const harvesterRole = await controller.HARVESTER_ROLE()
    const roles = {
      [adminRole]: "admin    ",
      [harvesterRole]: "harvester",
    }

    console.log("===== Events =====")

    // GrantRole
    let filter = controller.filters.GrantRole()
    let logs = await controller.queryFilter(filter)

    let events = []
    for (const log of logs) {
      events.push({
        block: log.blockNumber,
        //@ts-ignore
        role: log.args.role,
        //@ts-ignore
        addr: log.args.addr,
      })
    }

    console.log(`GrantRole`)
    console.log(`block | role | address`)
    for (const event of events) {
      console.log(`${event.block} | ${roles[event.role]} | ${event.addr}`)
    }

    // RevokeRole
    filter = controller.filters.RevokeRole()
    logs = await controller.queryFilter(filter)

    events = []
    for (const log of logs) {
      events.push({
        block: log.blockNumber,
        //@ts-ignore
        role: log.args.role,
        //@ts-ignore
        addr: log.args.addr,
      })
    }

    console.log(`RevokeRole`)
    console.log(`block | role | address`)
    for (const event of events) {
      console.log(`${event.block} | ${roles[event.role]} | ${event.addr}`)
    }

    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

main()
