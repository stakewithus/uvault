import {ethers} from "@nomiclabs/buidler"
import config from "./config"
import {deploy, getAddress} from "./lib"

async function main() {
  await deploy("GasRelayer", async (_account, network) => {
    const gasToken = getAddress(config, network, "gasToken")

    const GasRelayer = await ethers.getContractFactory("GasRelayer")
    const gasRelayer = await GasRelayer.deploy(gasToken)

    await gasRelayer.deployed()

    return gasRelayer
  })
}

main()
