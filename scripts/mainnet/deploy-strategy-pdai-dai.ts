import { ethers } from "hardhat"
import config from "../config"
import { deploy } from "../lib"

async function main() {
  await deploy("StrategyPdaiDai", async (_account, _network) => {
    const { controller, daiDegenVault } = config.mainnet

    const Strategy = await ethers.getContractFactory("StrategyPdaiDai")
    return Strategy.deploy(controller, daiDegenVault)
  })
}

main()
