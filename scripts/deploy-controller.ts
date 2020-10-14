import bre, {ethers} from "@nomiclabs/buidler"
import config from "./config"
import {getAccount, getAddress} from "./lib"

async function main() {
  const network = bre.network.name
  console.log(`Deploying Controller to ${network} network...`)

  try {
    const gasRelayer = getAddress(config, network, "gasRelayer")
    const treasury = getAddress(config, network, "treasury")

    await getAccount(ethers)

    const Controller = await ethers.getContractFactory("Controller")
    const controller = await Controller.deploy(treasury, gasRelayer)

    await controller.deployed()

    console.log("Controller deployed to:", controller.address)
    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

main()
