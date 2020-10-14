import {ethers} from "@nomiclabs/buidler"
import config from "./config"
import {deploy, getAddress} from "./lib"

async function main() {
  await deploy("Controller", async (_account, network) => {
    const gasRelayer = getAddress(config, network, "gasRelayer")
    const treasury = getAddress(config, network, "treasury")

    const Controller = await ethers.getContractFactory("Controller")
    const controller = await Controller.deploy(treasury, gasRelayer)

    await controller.deployed()

    return controller
  })
}

main()
