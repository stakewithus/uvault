import {ethers} from "@nomiclabs/buidler"
import config from "../config"
import {deploy} from "../lib"

async function main() {
  await deploy("StrategyUsdcToCusd", async (_account, _network) => {
    const controller = config.mainnet.controller
    const usdcVault = config.mainnet.usdcVault

    const Strategy = await ethers.getContractFactory("StrategyUsdcToCusdMainnet")
    const strategy = await Strategy.deploy(controller, usdcVault)

    await strategy.deployed()

    return strategy
  })
}

main()
