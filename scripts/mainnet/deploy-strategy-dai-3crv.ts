import {ethers} from "@nomiclabs/buidler"
import config from "../config"
import {deploy} from "../lib"

async function main() {
  await deploy("StrategyDaiTo3Crv", async (_account, _network) => {
    const controller = config.mainnet.controller
    const daiVault = config.mainnet.daiVault

    const Strategy = await ethers.getContractFactory("StrategyDaiTo3Crv")
    const strategy = await Strategy.deploy(controller, daiVault)

    await strategy.deployed()

    return strategy
  })
}

main()
