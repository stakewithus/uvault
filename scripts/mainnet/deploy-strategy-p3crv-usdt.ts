import {ethers} from "hardhat"
import config from "../config"
import {deploy} from "../lib"

async function main() {
  await deploy("StrategyP3CrvUsdt", async (_account, _network) => {
    const {controller, usdtDegenVault} = config.mainnet

    const Strategy = await ethers.getContractFactory("StrategyP3CrvUsdt")
    return Strategy.deploy(controller, usdtDegenVault)
  })
}

main()
