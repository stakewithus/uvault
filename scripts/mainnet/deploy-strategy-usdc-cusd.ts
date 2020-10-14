import {ethers} from "@nomiclabs/buidler"
import config from "../config"
import {deploy, getAddress} from "../lib"

async function main() {
  await deploy("StrategyUsdcToCusd", async (_account, network) => {
    const controller = getAddress(config, network, "controller")
    const usdcVault = getAddress(config, network, "usdcVault")

    const Strategy = await ethers.getContractFactory("StrategyUsdcToCusdMainnet")
    const strategy = await Strategy.deploy(controller, usdcVault)

    await strategy.deployed()

    return strategy
  })
}

main()
