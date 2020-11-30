import { ethers } from "hardhat"
import config from "../config"
import { deploy } from "../lib"

async function main() {
  await deploy("StrategyP3CrvDai", async (_account, _network) => {
    const { controller, daiGrowthVault } = config.mainnet

    const Strategy = await ethers.getContractFactory("StrategyP3CrvDai")
    return Strategy.deploy(controller, daiGrowthVault)
  })
}

main()
