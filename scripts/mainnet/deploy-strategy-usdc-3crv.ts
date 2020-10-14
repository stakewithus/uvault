import {ethers} from "@nomiclabs/buidler"
import config from "../config"
import {deploy} from "../lib"

async function main() {
  await deploy("StrategyUsdcTo3Crv", async (_account, _network) => {
    const controller = config.mainnet.controller
    const usdcVault = config.mainnet.usdcVault

    const Strategy = await ethers.getContractFactory("StrategyUsdcTo3Crv")
    const strategy = await Strategy.deploy(controller, usdcVault)

    await strategy.deployed()

    return strategy
  })
}

main()
