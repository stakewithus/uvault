import {ethers} from "@nomiclabs/buidler"
import config from "../config"
import {deploy} from "../lib"

async function main() {
  await deploy("StrategyUsdtTo3Crv", async (_account, _network) => {
    const controller = config.mainnet.controller
    const usdtVault = config.mainnet.usdtVault

    const Strategy = await ethers.getContractFactory("StrategyUsdtTo3Crv")
    return Strategy.deploy(controller, usdtVault)
  })
}

main()
