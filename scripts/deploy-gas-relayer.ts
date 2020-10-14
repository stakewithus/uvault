import bre, {ethers} from "@nomiclabs/buidler"
import config from "./config"
import {getAccount, getAddress} from "./lib"

async function main() {
  const network = bre.network.name
  console.log(`Deploying GasRelayer to ${network} network...`)

  try {
    const gasToken = getAddress(config, network, "gasToken")

    await getAccount(ethers)

    const GasRelayer = await ethers.getContractFactory("GasRelayer")
    const gasRelayer = await GasRelayer.deploy(gasToken)

    await gasRelayer.deployed()

    console.log("GasRelayer deployed to:", gasRelayer.address)
    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

main()
