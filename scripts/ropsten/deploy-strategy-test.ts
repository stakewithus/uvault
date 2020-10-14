import {ethers} from "@nomiclabs/buidler"
import config from "../config"
import {deploy, getAddress} from "../lib"

async function main() {
  await deploy("StrategyTest", async (_account, network) => {
    const erc20 = getAddress(config, network, "erc20")
    const controller = getAddress(config, network, "controller")
    const vault = getAddress(config, network, "vault")

    const Strategy = await ethers.getContractFactory("StrategyTest")
    const strategy = await Strategy.deploy(controller, vault, erc20)

    await strategy.deployed()

    return strategy
  })
}

main()
