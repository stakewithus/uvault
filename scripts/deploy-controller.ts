import {ethers} from "hardhat"
import config from "./config"
import {deploy, getAddress} from "./lib"

async function main() {
  await deploy("Controller", async (_account, network) => {
    const treasury = getAddress(config, network, "treasury")

    const Controller = await ethers.getContractFactory("Controller")
    return Controller.deploy(treasury)
  })
}

main()
