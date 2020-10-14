import bre, {ethers} from "@nomiclabs/buidler"
import config from "../config"
import {getAccount, getAddress} from "../lib"

async function main() {
  const network = bre.network.name
  console.log(`Deploying StrategyTest to ${network} network...`)

  try {
    const erc20 = getAddress(config, network, "erc20")
    const controller = getAddress(config, network, "controller")
    const vault = getAddress(config, network, "vault")

    await getAccount(ethers)

    const Strategy = await ethers.getContractFactory("StrategyTest")
    const strategy = await Strategy.deploy(controller, vault, erc20)

    await strategy.deployed()

    console.log("StrategyTest deployed to:", strategy.address)
    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

main()
