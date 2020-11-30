import { ethers } from "hardhat"
import config from "../config"
import { deploy } from "../lib"

async function main() {
  await deploy("StrategyP3CrvUsdc", async (_account, _network) => {
    const { controller, usdcGrowthVault } = config.mainnet

    const Strategy = await ethers.getContractFactory("StrategyP3CrvUsdc")
    return Strategy.deploy(controller, usdcGrowthVault)
  })
}

main()
