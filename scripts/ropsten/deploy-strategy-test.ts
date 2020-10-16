import {ethers} from "@nomiclabs/buidler"
import config from "../config"
import {deploy} from "../lib"

async function main() {
  await deploy("StrategyTest", async (_account, _network) => {
    const {erc20, controller, vault} = config.ropsten

    const Strategy = await ethers.getContractFactory("StrategyTest")
    const strategy = await Strategy.deploy(controller, vault, erc20)

    await strategy.deployed()

    return strategy
  })
}

main()
